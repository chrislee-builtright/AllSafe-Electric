import 'server-only';
import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

/**
 * Server-side spam defenses for public forms: reCAPTCHA v3 verification, per-IP rate limiting and
 * cheap content heuristics. Rate-limit records contain only a keyed hash, count and expiry.
 */

const SITE_HOSTS = ['allsafehomeservice.com', 'www.allsafehomeservice.com', 'localhost'];

export type CaptchaResult = { ok: boolean; skipped?: boolean; reason?: string; score?: number };

export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  ip: string | null
): Promise<CaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('[recaptcha] RECAPTCHA_SECRET_KEY is not set');
    return { ok: false, reason: 'verifier-unconfigured' };
  }
  if (!token) return { ok: false, reason: 'missing-token' };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    const data = (await res.json()) as {
      success: boolean;
      score?: number;
      action?: string;
      hostname?: string;
      'error-codes'?: string[];
    };
    if (!data.success) return { ok: false, reason: (data['error-codes'] ?? ['rejected']).join(',') };
    if (data.action !== expectedAction) return { ok: false, reason: 'action-mismatch', score: data.score };
    const host = data.hostname ?? '';
    if (!host || (!SITE_HOSTS.includes(host) && host !== process.env.VERCEL_URL)) {
      return { ok: false, reason: 'hostname-mismatch', score: data.score };
    }
    const min = Number(process.env.RECAPTCHA_MIN_SCORE) || 0.5;
    if ((data.score ?? 0) < min) return { ok: false, reason: 'low-score', score: data.score };
    return { ok: true, score: data.score };
  } catch (error) {
    console.error('[recaptcha] verification unavailable', error);
    return { ok: false, reason: 'verifier-unreachable' };
  }
}

let limiterSchema: Promise<unknown> | null = null;

/** Atomic limiter shared across serverless instances; expired buckets are removed on use. */
export async function rateLimited(key: string | null, limit = 5, windowMs = 10 * 60 * 1000): Promise<boolean> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!key || !url || !secret) return true;
  const db = neon(url);
  const hash = createHmac('sha256', secret).update(key).digest('hex');
  try {
    limiterSchema ??= db`create table if not exists form_rate_limits (
      key_hash text primary key, hits integer not null, expires_at timestamptz not null
    )`.catch(error => { limiterSchema = null; throw error; });
    await limiterSchema;
    await db`delete from form_rate_limits where expires_at < now()`;
    const rows = await db`insert into form_rate_limits (key_hash, hits, expires_at)
      values (${hash}, 1, now() + ${windowMs} * interval '1 millisecond')
      on conflict (key_hash) do update set hits = form_rate_limits.hits + 1
      returning hits`;
    return Number(rows[0].hits) > limit;
  } catch (error) {
    console.error('[form-guard] rate limiter unavailable', error);
    return true;
  }
}

export function clientIp(h: Headers): string | null {
  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return fwd || h.get('x-real-ip') || null;
}

/** True when the text looks like link spam or header injection rather than a service request. */
export function looksLikeSpam(fields: { name: string; email: string; message: string }): boolean {
  const urls = (fields.message.match(/https?:\/\/|www\./gi) ?? []).length;
  if (urls > 2) return true;
  if (/https?:\/\/|www\./i.test(fields.name)) return true;
  if (/[\r\n]/.test(fields.name + fields.email)) return true;
  if (/(?:bcc|cc|content-type|mime-version)\s*:/i.test(fields.name + fields.email + fields.message)) return true;
  return false;
}
