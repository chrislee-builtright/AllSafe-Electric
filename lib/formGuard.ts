import 'server-only';

/**
 * Server-side spam defenses for public forms: reCAPTCHA v3 verification, per-IP rate limiting and
 * cheap content heuristics. Everything here is best-effort and never stores personal data.
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
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY is not set; skipping verification');
    return { ok: true, skipped: true };
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
    if (host && !SITE_HOSTS.includes(host) && !host.endsWith('.vercel.app')) {
      return { ok: false, reason: 'hostname-mismatch', score: data.score };
    }
    const min = Number(process.env.RECAPTCHA_MIN_SCORE) || 0.5;
    if ((data.score ?? 0) < min) return { ok: false, reason: 'low-score', score: data.score };
    return { ok: true, score: data.score };
  } catch (error) {
    // Google being unreachable must not cost a real customer; the honeypot, timing and rate limit still ran.
    console.error('[recaptcha] verification unavailable, allowing request', error);
    return { ok: true, skipped: true, reason: 'verifier-unreachable' };
  }
}

const hits = new Map<string, number[]>();

/** Sliding-window limiter, per server instance. Returns true when the caller is over the limit. */
export function rateLimited(key: string | null, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  if (!key) return false;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return recent.length > limit;
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
