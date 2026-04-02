import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Lightweight cron endpoint for external services (cron-job.org).
 * Triggers feed ingestion only (not digest — that stays daily).
 * Authenticates via Authorization: Bearer header only — never pass keys in URLs.
 */
export async function GET(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "heavy");
  if (rateLimitError) return rateLimitError;

  const cronKey = process.env.EXTERNAL_CRON_KEY?.trim() || process.env.INGEST_API_KEY?.trim();

  if (!cronKey) {
    return NextResponse.json({ error: "Server misconfiguration: no cron key set" }, { status: 500 });
  }

  const providedKey = request.headers.get("authorization")?.replace("Bearer ", "");

  if (providedKey !== cronKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use fixed base URL to prevent SSRF
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin);

  try {
    const res = await fetch(`${baseUrl}/api/ingest`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.INGEST_API_KEY || ""}` },
    });
    const data = await res.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ingest: data,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    }, { status: 500 });
  }
}
