import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { saveCall, recordCallAlert } from '@/lib/leadStore';
import { sendCallAlert, sendOpsAlert } from '@/lib/leadEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CallRail post-call webhook receiver: an independent path from CallRail's own
 * notification emails. Add this URL in CallRail > Settings > Integrations > Webhooks
 * (Post-Call): https://allsafehomeservice.com/api/callrail?token=<CALLRAIL_WEBHOOK_SECRET>
 *
 * Every call is stored, then Jud is emailed. A failed email is retried by the cron.
 */
function tokenOk(req: NextRequest) {
  const secret = process.env.CALLRAIL_WEBHOOK_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.nextUrl.searchParams.get('token') ?? '');
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: NextRequest) {
  if (!tokenOk(req)) return NextResponse.json({ ok: false }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const callId = String(body.id ?? body.resource_id ?? '').slice(0, 100);
  if (!callId) return NextResponse.json({ ok: false, error: 'missing call id' }, { status: 400 });

  let isNew = true;
  try {
    isNew = await saveCall(callId, body);
  } catch (error) {
    console.error(`[callrail ${callId}] database save failed`, error);
  }
  if (!isNew) return NextResponse.json({ ok: true, duplicate: true });

  try {
    await sendCallAlert(body);
    await recordCallAlert(callId, true).catch(() => undefined);
  } catch (error) {
    const message = String((error as Error).message ?? error);
    await recordCallAlert(callId, false, message).catch(() => undefined);
    await sendOpsAlert('Call alert to Jud failed', `CallRail call ${callId}\nError: ${message}\nCaller: ${body.customer_phone_number ?? '-'}`);
    // 200 so CallRail does not hammer us; the cron retries from the stored row.
  }
  return NextResponse.json({ ok: true });
}
