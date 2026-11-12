'use server';

import { headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { attributionKeys } from '@/lib/attribution';
import { business } from '@/lib/business';
import { services } from '@/lib/services';
import { citySlugs } from '@/lib/cities';
import { saveLead, recordDelivery, markOpsNotified } from '@/lib/leadStore';
import { sendLeadAlert, sendOpsAlert, formatLead } from '@/lib/leadEmail';

/**
 * Estimate form Server Action, planning/docs/07 §4.
 * No third-party iframe. Honeypot + timing check, NO CAPTCHA.
 *
 * Delivery order (the lead is never lost to a failed email):
 *   1. SAVE to Postgres (Neon) first. This is the system of record.
 *   2. email  → Jud via Resend (LEAD_EMAIL_TO)
 *   3. webhook → Housecall Pro (create customer), if configured
 *   4. webhook → Built Right Digital lead log, if configured
 *   5. If Jud's email fails, the Built-Right backstop address (LEAD_OPS_EMAIL) is told
 *      immediately with the full lead, and /api/cron/lead-alerts retries every 5 minutes.
 *   6. GA4 `generate_lead`. Fired client-side on the returned {ok:true}
 *
 * Confirm receipt once the lead is saved OR at least one destination accepted it.
 * Only when nothing worked do we retain the form values and offer the phone fallback.
 */

export interface EstimateState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  leadId?: string;
}

const zips = new Set([
  // Parker / Douglas / south-metro service-area ZIPs (non-exhaustive; audit-friendly allowlist)
  '80134', '80138', '80104', '80108', '80109', '80016', '80015', '80112', '80111',
  '80124', '80126', '80129', '80130', '80125', '80116', '80107', '80118', '80131',
  '80122', '80120', '80121', '80013', '80014', '80231', '80237',
]);

function digits(s: string) {
  return (s || '').replace(/\D/g, '');
}

export async function submitEstimate(
  _prev: EstimateState,
  formData: FormData
): Promise<EstimateState> {
  const get = (k: string) => String(formData.get(k) ?? '').trim().slice(0, k === 'message' ? 5000 : 500);
  const values: Record<string, string> = {
    name: get('name'),
    phone: get('phone'),
    email: get('email'),
    zip: get('zip'),
    message: get('message'),
    service: get('service'),
    when: get('when'),
  };

  // Honeypot + timing check
  if (get('company_website')) return { ok: true, leadId: 'ignored' }; // silent drop for bots
  const started = Number(get('form_started_at')) || 0;
  if (started && Date.now() - started < 2500) {
    return { ok: true, leadId: 'ignored' };
  }

  const fieldErrors: Record<string, string> = {};
  if (values.name.length < 2) fieldErrors.name = 'Please enter your name.';
  if (digits(values.phone).length !== 10)
    fieldErrors.phone = 'Enter a 10-digit US phone number so we can reach you.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
    fieldErrors.email = 'Enter a valid email address.';
  if (!/^\d{5}$/.test(values.zip)) fieldErrors.zip = 'Enter your 5-digit ZIP code.';
  if (values.message.length < 5)
    fieldErrors.message = 'A sentence about what is going on helps us come prepared.';

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors, values, error: 'Please fix the highlighted fields.' };
  }

  const outOfArea = !zips.has(values.zip);
  const serviceMeta = services.find((s) => s.slug === values.service || s.navLabel === values.service);
  const photo = formData.get('photo');
  const hasPhoto = photo instanceof File && photo.size > 0;

  const submittedId = get('submission_id');
  const leadId = /^AS-[0-9a-f-]{36}$/i.test(submittedId) ? submittedId : `AS-${randomUUID()}`;
  const measurementConsent = get('measurement_consent') === 'granted';
  const attribution = Object.fromEntries(attributionKeys.map(key => [key, measurementConsent ? get(key) : '']));
  const hdrs = await headers();
  const lead = {
    ...attribution,
    measurement_consent: measurementConsent ? 'granted' : 'denied',
    is_test: false,
    leadId,
    receivedAt: new Date().toISOString(),
    name: values.name,
    phone: business.phone.display === values.phone ? values.phone : formatPhone(values.phone),
    email: values.email,
    zip: values.zip,
    outOfArea,
    message: values.message,
    service: serviceMeta?.navLabel ?? values.service ?? 'General',
    serviceSlug: serviceMeta?.slug ?? null,
    urgency: values.when || 'unspecified',
    hasPhoto,
    referer: safePagePath(hdrs.get('referer')),
    source: 'allsafe-website-estimate-form',
  };

  // 1. System of record first.
  let saved = false;
  try {
    saved = await saveLead(lead);
  } catch (error) {
    console.error(`[lead ${leadId}] database save failed`, error);
  }

  // 2-4. Fan out. allSettled so one slow/failed destination cannot block the others.
  const [emailR, hcpR, brdR] = await Promise.allSettled([
    sendLeadAlert(lead),
    postWebhook(process.env.HCP_LEAD_WEBHOOK_URL, lead, 'housecall-pro'),
    postWebhook(process.env.BRD_LEAD_LOG_WEBHOOK_URL, lead, 'brd-lead-log'),
  ]);
  const alertSent = emailR.status === 'fulfilled';
  const alertError = emailR.status === 'rejected' ? String(emailR.reason?.message ?? emailR.reason) : undefined;
  const webhook = (r: PromiseSettledResult<boolean>): 'sent' | 'failed' | 'skipped' =>
    r.status === 'rejected' ? 'failed' : r.value ? 'sent' : 'skipped';
  const hcp = webhook(hcpR);
  const brd = webhook(brdR);
  const delivered = saved || alertSent || hcp === 'sent' || brd === 'sent';

  if (saved) {
    try {
      await recordDelivery(leadId, { alertSent, alertError, hcp, brd });
    } catch (error) {
      console.error(`[lead ${leadId}] could not record delivery status`, error);
    }
  }

  // 5. Backstop: tell Built-Right right away if the owner email did not go out, or nothing was saved.
  if (!alertSent || !saved) {
    const reasons = [
      !alertSent ? `Owner email to Jud FAILED: ${alertError}` : null,
      !saved ? 'Database save FAILED (lead exists only in the destinations that accepted it)' : null,
      `Housecall Pro: ${hcp}`,
      `BRD lead log: ${brd}`,
      saved ? 'The 5-minute retry job will keep trying to email Jud.' : 'No retry is possible without the database. Contact the customer manually.',
    ].filter(Boolean);
    const opsSent = await sendOpsAlert(
      `Lead delivery problem: ${lead.service} (${lead.zip})`,
      `${reasons.join('\n')}\n\n--- LEAD ---\n${formatLead(lead)}`
    );
    if (opsSent && saved) await markOpsNotified('leads', leadId).catch(() => undefined);
  }

  if (!delivered) {
    console.error(`[lead ${leadId}] No delivery destination accepted the request.`);
    return {
      ok: false,
      values,
      error: `We could not confirm delivery of your request. Please call ${business.phone.display} to arrange your visit. Your details are still below.`,
    };
  }

  return {
    ok: true,
    leadId,
    values: {...values, city: guessCity(values.zip) ?? '' },
  };
}

function safePagePath(value: string | null) {
  try { return value ? new URL(value).pathname.slice(0, 300) : null; } catch { return null; }
}

function formatPhone(v: string) {
  const d = digits(v);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function guessCity(zip: string): string | null {
  const m: Record<string, string> = {
    '80134': 'parker-co',
    '80138': 'parker-co',
    '80104': 'castle-rock-co',
    '80108': 'castle-rock-co',
    '80109': 'castle-rock-co',
    '80126': 'highlands-ranch-co',
    '80129': 'highlands-ranch-co',
    '80130': 'highlands-ranch-co',
    '80124': 'lone-tree-co',
    '80112': 'centennial-co',
    '80111': 'centennial-co',
    '80015': 'centennial-co',
    '80016': 'centennial-co',
  };
  const slug = m[zip];
  return slug && citySlugs.includes(slug) ? slug : null;
}

async function postWebhook(url: string | undefined, lead: unknown, label: string) {
  if (!url) {
    console.info(`[lead] ${label} webhook not configured`);
    return false;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`${label} ${res.status}`);
  return true;
}

