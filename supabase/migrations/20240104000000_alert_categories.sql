-- Add categories column to alert_rules for per-subscriber filtering
alter table alert_rules add column if not exists categories text[] default '{}';
