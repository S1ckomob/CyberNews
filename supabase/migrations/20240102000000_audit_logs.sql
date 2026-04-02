-- Audit log table for tracking security-sensitive actions
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text not null,
  ip text not null default 'unknown',
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Index for querying by action and time
create index idx_audit_logs_action on audit_logs (action);
create index idx_audit_logs_created_at on audit_logs (created_at desc);
create index idx_audit_logs_actor on audit_logs (actor);

-- RLS: no public access — only service role can read/write
alter table audit_logs enable row level security;

-- Auto-delete logs older than 90 days (run via cron or manually)
-- Keeping the table lean while preserving recent history
