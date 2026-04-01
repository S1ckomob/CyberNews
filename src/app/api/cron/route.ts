import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const results: Record<string, unknown> = {};

  // 1. Run feed ingestion
  try {
    const ingestRes = await fetch(`${baseUrl}/api/ingest`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.INGEST_API_KEY || ""}`,
      },
    });
    results.ingest = await ingestRes.json();
  } catch (err) {
    results.ingest = { error: (err as Error).message };
  }

  // 2. Send daily digest
  try {
    const digestRes = await fetch(`${baseUrl}/api/digest`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.INGEST_API_KEY || ""}`,
      },
    });
    results.digest = await digestRes.json();
  } catch (err) {
    results.digest = { error: (err as Error).message };
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  });
}
