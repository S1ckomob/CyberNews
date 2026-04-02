import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Lightweight cron endpoint for external services (cron-job.org).
 * Triggers feed ingestion only (not digest — that stays daily).
 * Authenticates via Authorization: Bearer header only.
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

  // Call ingest directly via internal POST to avoid proxy/redirect issues
  // Build an internal request with the correct auth
  const ingestUrl = new URL("/api/ingest", request.url);
  const ingestRequest = new NextRequest(ingestUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.INGEST_API_KEY || ""}`,
      "x-admin-key": process.env.INGEST_API_KEY || "",
    },
  });

  try {
    // Dynamically import and call the ingest handler directly
    const { POST } = await import("@/app/api/ingest/route");
    const ingestResponse = await POST(ingestRequest);
    const data = await ingestResponse.json();

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
