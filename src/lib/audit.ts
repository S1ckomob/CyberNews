import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type AuditAction =
  | "article.create"
  | "article.delete"
  | "ingest.run"
  | "digest.send"
  | "classify.run"
  | "alert_rules.update"
  | "subscriber.add"
  | "admin.login";

interface AuditEntry {
  action: AuditAction;
  actor: string;
  ip: string;
  details?: Record<string, unknown>;
}

/**
 * Write an audit log entry. Fire-and-forget — never blocks the response.
 */
export function logAudit(request: NextRequest, action: AuditAction, details?: Record<string, unknown>) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const actor =
    request.headers.get("x-admin-key") ? "admin" :
    request.headers.get("authorization") ? "api-key" :
    request.headers.get("x-vercel-cron-secret") ? "cron" :
    "anonymous";

  const entry: AuditEntry = { action, actor, ip, details };

  // Fire-and-forget — don't await, don't block the response
  getSupabaseAdmin()
    .from("audit_logs")
    .insert({
      action: entry.action,
      actor: entry.actor,
      ip: entry.ip,
      details: entry.details || {},
      created_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) console.error("[audit] Failed to write log:", error.message);
    });
}
