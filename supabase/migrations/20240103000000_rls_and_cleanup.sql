-- ============================================================
-- RLS write policies for all tables
-- All writes go through service_role in the app, so these
-- policies block direct abuse via the anon key.
-- ============================================================

-- ---------- articles ----------

-- Only service_role can insert/update/delete
create policy "Service role can insert articles"
  on articles for insert
  to service_role
  with check (true);

create policy "Service role can update articles"
  on articles for update
  to service_role
  using (true)
  with check (true);

create policy "Service role can delete articles"
  on articles for delete
  to service_role
  using (true);

-- ---------- threat_actors ----------

create policy "Service role can insert threat_actors"
  on threat_actors for insert
  to service_role
  with check (true);

create policy "Service role can update threat_actors"
  on threat_actors for update
  to service_role
  using (true)
  with check (true);

create policy "Service role can delete threat_actors"
  on threat_actors for delete
  to service_role
  using (true);

-- ---------- subscribers ----------
-- Table may not have RLS enabled yet

alter table if exists subscribers enable row level security;

-- No public read — only service_role
create policy "Service role can manage subscribers"
  on subscribers for all
  to service_role
  using (true)
  with check (true);

-- ---------- alert_rules ----------

alter table if exists alert_rules enable row level security;

-- No public read — only service_role
create policy "Service role can manage alert_rules"
  on alert_rules for all
  to service_role
  using (true)
  with check (true);

-- ---------- audit_logs ----------
-- Already has RLS enabled from previous migration, add explicit policy

create policy "Service role can manage audit_logs"
  on audit_logs for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- Audit log cleanup function (deletes entries older than 90 days)
-- ============================================================

create or replace function cleanup_audit_logs()
returns void
language sql
security definer
as $$
  delete from audit_logs
  where created_at < now() - interval '90 days';
$$;
