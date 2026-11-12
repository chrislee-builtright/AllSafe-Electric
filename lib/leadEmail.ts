import 'server-only';
import { business } from '@/lib/business';

/**
 * Owner alerts and the backstop ("ops") alert, both through Resend.
 *
 *   LEAD_EMAIL_TO    where Jud's alerts go (defaults to business.email.leads)
 *   LEAD_EMAIL_FROM  must be on a domain verified in Resend (NOT a gmail address)
 *   LEAD_OPS_EMAIL   Built-Right Digital backstop: told whenever an owner alert fails
 */

const FROM_NAME = 'Allsafe Electric Website';

async function resend(opts: { to: string[]; subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!key) throw new Error('RESEND_API_KEY not set');
  if (!from) throw new Error('LEAD_EMAIL_FROM not set (needs a Resend-verified sender)');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${FROM_NAME} <${from}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new Error(`Resend ${res.status} ${detail}`);
  }
}

const ownerTo = () => [process.env.LEAD_EMAIL_TO || business.email.leads];
const opsTo = () => (process.env.LEAD_OPS_EMAIL ? [process.env.LEAD_OPS_EMAIL] : []);

function line(label: string, value: unknown) {
  const v = value === undefined || value === null || value === '' ? '-' : String(value);
  return `${label}: ${v}`;
}

export function formatLead(lead: Record<string, unknown>) {
  const attribution = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'landing_page']
    .filter((k) => lead[k])
    .map((k) => line(k, lead[k]));
  return [
    line('Name', lead.name),
    line('Phone', lead.phone),
    line('Email', lead.email),
    line('ZIP', `${lead.zip ?? ''}${lead.outOfArea ? ' (outside our usual service area)' : ''}`),
    line('Service', lead.service),
    line('How soon', lead.urgency),
    line('Photo attached on form', lead.hasPhoto ? 'yes (ask the customer to text it)' : 'no'),
    '',
    'What they said:',
    String(lead.message ?? ''),
    '',
    line('Page', lead.referer),
    line('Received', lead.receivedAt),
    line('Lead ID', lead.leadId),
    ...(attribution.length ? ['', ...attribution] : []),
  ].join('\n');
}

export async function sendLeadAlert(lead: Record<string, unknown>) {
  await resend({
    to: ownerTo(),
    subject: `New estimate request: ${lead.service} (${lead.zip}) - ${lead.name}`,
    text: formatLead(lead),
    replyTo: typeof lead.email === 'string' ? lead.email : undefined,
  });
}

export async function sendCallAlert(call: Record<string, unknown>) {
  const answered = call.answered === true || call.answered === 'true';
  const who = String(call.customer_name || call.customer_phone_number || 'Unknown caller');
  const seconds = Number(call.duration) || 0;
  await resend({
    to: ownerTo(),
    subject: `${answered ? 'Call' : 'MISSED call'}: ${who}`,
    text: [
      line('Caller', call.customer_name),
      line('Caller number', call.customer_phone_number),
      line('Answered', answered ? 'yes' : 'NO - call them back'),
      line('Length', `${seconds}s`),
      line('Tracking number dialed', call.tracking_phone_number),
      line('Source', call.source),
      line('Landing page', call.landing_page_url),
      line('Started', call.start_time),
      line('First-time caller', call.first_call),
      line('CallRail call ID', call.id),
      ...(call.recording_player ? [line('Recording', call.recording_player)] : []),
    ].join('\n'),
  });
}

/** Backstop notice to Built-Right Digital. Never throws: it must not mask the original failure. */
export async function sendOpsAlert(subject: string, text: string): Promise<boolean> {
  const to = opsTo();
  if (!to.length) {
    console.error('[lead] LEAD_OPS_EMAIL not set; backstop alert not sent:', subject);
    return false;
  }
  try {
    await resend({ to, subject: `[Allsafe site] ${subject}`, text });
    return true;
  } catch (error) {
    console.error('[lead] backstop alert failed', error);
    return false;
  }
}
