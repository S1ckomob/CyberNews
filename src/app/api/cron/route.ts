import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret to prevent unauthorized triggers
  const cronSecret = request.headers.get("x-vercel-cron-secret");
  const vercelCronSecret = process.env.CRON_SECRET?.trim();

  if (!vercelCronSecret || cronSecret !== vercelCronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use fixed base URL to prevent SSRF via Host header manipulation
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : request.nextUrl.origin;

  const apiKey = process.env.INGEST_API_KEY || "";
  const results: Record<string, unknown> = {};

  // 1. Run feed ingestion
  try {
    const ingestRes = await fetch(`${baseUrl}/api/ingest`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    results.ingest = await ingestRes.json();
  } catch (err) {
    results.ingest = { error: (err as Error).message };
  }

  // 2. Send daily digest
  try {
    const digestRes = await fetch(`${baseUrl}/api/digest`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    results.digest = await digestRes.json();
  } catch (err) {
    results.digest = { error: (err as Error).message };
  }

  // 3. Cleanup audit logs older than 90 days
  try {
    const { error } = await getSupabaseAdmin().rpc("cleanup_audit_logs");
    results.audit_cleanup = error ? { error: error.message } : { success: true };
  } catch (err) {
    results.audit_cleanup = { error: (err as Error).message };
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  });
}
