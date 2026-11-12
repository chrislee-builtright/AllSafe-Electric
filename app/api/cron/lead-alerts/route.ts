import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { pendingLeads, pendingCalls, recordDelivery, recordCallAlert, markOpsNotified } from '@/lib/leadStore';
import { sendLeadAlert, sendCallAlert, sendOpsAlert, formatLead } from '@/lib/leadEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Vercel Cron (every 5 min). Finishes any owner alert that failed the first time. */
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  let leadsSent = 0, leadsFailed = 0, callsSent = 0, callsFailed = 0;

  for (const lead of await pendingLeads()) {
    let sent = false, error: string | undefined;
    try { await sendLeadAlert(lead); sent = true; } catch (e) { error = String((e as Error).message ?? e); }
    await recordDelivery(lead.leadId, { alertSent: sent, alertError: error, hcp: 'skipped', brd: 'skipped' }).catch(() => undefined);
    if (sent) { leadsSent++; continue; }
    leadsFailed++;
    // The first-attempt backstop email may itself have failed; keep telling BRD until one lands.
    if (!lead.opsNotified) {
      const ok = await sendOpsAlert(`Lead still not delivered to Jud (attempt ${lead.alertAttempts + 1})`, `Last error: ${error}\n\n${formatLead(lead)}`);
      if (ok) await markOpsNotified('leads', lead.leadId).catch(() => undefined);
    }
  }

  for (const call of await pendingCalls()) {
    let sent = false, error: string | undefined;
    try { await sendCallAlert(call.payload); sent = true; } catch (e) { error = String((e as Error).message ?? e); }
    await recordCallAlert(call.callId, sent, error).catch(() => undefined);
    if (sent) callsSent++; else callsFailed++;
  }

  return NextResponse.json({ ok: true, leadsSent, leadsFailed, callsSent, callsFailed });
}
