import 'server-only';
import { neon } from '@neondatabase/serverless';

/**
 * Durable lead + call log (Neon Postgres via the Vercel integration).
 *
 * Every estimate-form submission is written here BEFORE any email or webhook is
 * attempted, so a failed delivery never loses a lead. Rows carry per-destination
 * delivery status so the retry cron can finish the job.
 */

export interface StoredLead {
  leadId: string;
  receivedAt: string;
  source: string;
  is_test: boolean;
  name: string;
  phone: string;
  email: string;
  zip: string;
  service: string;
  message: string;
  [key: string]: unknown;
}

type Sql = ReturnType<typeof neon>;

let sqlClient: Sql | null | undefined;
let schemaReady: Promise<void> | null = null;

function sql(): Sql | null {
  if (sqlClient !== undefined) return sqlClient;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  sqlClient = url ? neon(url) : null;
  return sqlClient;
}

export function storeConfigured() {
  return sql() !== null;
}

async function ready(db: Sql) {
  schemaReady ??= (async () => {
    await db`
      create table if not exists leads (
        lead_id text primary key,
        received_at timestamptz not null default now(),
        source text not null,
        is_test boolean not null default false,
        name text, phone text, email text, zip text, service text, message text,
        payload jsonb not null,
        alert_status text not null default 'pending',
        alert_attempts int not null default 0,
        alert_last_error text,
        alert_last_attempt_at timestamptz,
        alert_sent_at timestamptz,
        hcp_status text not null default 'skipped',
        brd_status text not null default 'skipped',
        ops_notified_at timestamptz
      )`;
    await db`create index if not exists leads_alert_idx on leads (alert_status, received_at)`;
    await db`
      create table if not exists calls (
        call_id text primary key,
        received_at timestamptz not null default now(),
        payload jsonb not null,
        alert_status text not null default 'pending',
        alert_attempts int not null default 0,
        alert_last_error text,
        alert_sent_at timestamptz,
        ops_notified_at timestamptz
      )`;
  })().catch((error) => {
    schemaReady = null; // allow a later request to retry creating the schema
    throw error;
  });
  return schemaReady;
}

/** Idempotent: a retried submission with the same leadId does not create a second row. */
export async function saveLead(lead: StoredLead): Promise<boolean> {
  const db = sql();
  if (!db) throw new Error('DATABASE_URL not configured');
  await ready(db);
  await db`
    insert into leads (lead_id, received_at, source, is_test, name, phone, email, zip, service, message, payload)
    values (${lead.leadId}, ${lead.receivedAt}, ${lead.source}, ${lead.is_test},
            ${lead.name}, ${lead.phone}, ${lead.email}, ${lead.zip}, ${lead.service}, ${lead.message},
            ${JSON.stringify(lead)}::jsonb)
    on conflict (lead_id) do nothing`;
  return true;
}

export interface DeliveryResult {
  alertSent: boolean;
  alertError?: string;
  hcp: 'sent' | 'failed' | 'skipped';
  brd: 'sent' | 'failed' | 'skipped';
}

export async function recordDelivery(leadId: string, r: DeliveryResult) {
  const db = sql();
  if (!db) return;
  await ready(db);
  await db`
    update leads set
      alert_status = ${r.alertSent ? 'sent' : 'failed'},
      alert_attempts = alert_attempts + 1,
      alert_last_attempt_at = now(),
      alert_last_error = ${r.alertSent ? null : (r.alertError ?? 'unknown error').slice(0, 500)},
      alert_sent_at = case when ${r.alertSent} then now() else alert_sent_at end,
      hcp_status = ${r.hcp},
      brd_status = ${r.brd}
    where lead_id = ${leadId}`;
}

export async function markOpsNotified(table: 'leads' | 'calls', id: string) {
  const db = sql();
  if (!db) return;
  await ready(db);
  if (table === 'leads') {
    await db`update leads set ops_notified_at = now() where lead_id = ${id}`;
  } else {
    await db`update calls set ops_notified_at = now() where call_id = ${id}`;
  }
}

/** Real (non-test) leads whose owner alert has not gone out yet. Oldest first. */
export async function pendingLeads(limit = 25): Promise<(StoredLead & { alertAttempts: number; opsNotified: boolean })[]> {
  const db = sql();
  if (!db) return [];
  await ready(db);
  const rows = (await db`
    select payload, alert_attempts, ops_notified_at
    from leads
    where alert_status <> 'sent' and is_test = false
      and received_at > now() - interval '3 days'
      and alert_attempts < 48
    order by received_at asc
    limit ${limit}`) as { payload: StoredLead; alert_attempts: number; ops_notified_at: string | null }[];
  return rows.map((row) => ({ ...row.payload, alertAttempts: row.alert_attempts, opsNotified: Boolean(row.ops_notified_at) }));
}

/** Stores a CallRail post-call webhook payload. Returns false when this call was already stored. */
export async function saveCall(callId: string, payload: unknown) {
  const db = sql();
  if (!db) throw new Error('DATABASE_URL not configured');
  await ready(db);
  const rows = (await db`
    insert into calls (call_id, payload) values (${callId}, ${JSON.stringify(payload)}::jsonb)
    on conflict (call_id) do nothing
    returning call_id`) as { call_id: string }[];
  return rows.length === 1; // false = duplicate delivery from CallRail, already alerted
}

export async function recordCallAlert(callId: string, sent: boolean, error?: string) {
  const db = sql();
  if (!db) return;
  await ready(db);
  await db`
    update calls set
      alert_status = ${sent ? 'sent' : 'failed'},
      alert_attempts = alert_attempts + 1,
      alert_last_error = ${sent ? null : (error ?? 'unknown error').slice(0, 500)},
      alert_sent_at = case when ${sent} then now() else alert_sent_at end
    where call_id = ${callId}`;
}

export async function pendingCalls(limit = 25): Promise<{ callId: string; payload: Record<string, unknown>; alertAttempts: number }[]> {
  const db = sql();
  if (!db) return [];
  await ready(db);
  const rows = (await db`
    select call_id, payload, alert_attempts from calls
    where alert_status <> 'sent' and received_at > now() - interval '3 days' and alert_attempts < 48
    order by received_at asc limit ${limit}`) as { call_id: string; payload: Record<string, unknown>; alert_attempts: number }[];
  return rows.map((r) => ({ callId: r.call_id, payload: r.payload, alertAttempts: r.alert_attempts }));
}
