import { NextRequest, NextResponse } from "next/server";

/**
 * Validate API key or Vercel cron secret on protected endpoints.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function requireApiAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-vercel-cron-secret");
  const adminKeyHeader = request.headers.get("x-admin-key");
  const apiKey = process.env.INGEST_API_KEY?.trim();
  const vercelCronSecret = process.env.CRON_SECRET?.trim();
  const adminKey =
    process.env.ADMIN_API_KEY?.trim() || process.env.INGEST_API_KEY?.trim();

  // Require at least one auth method to be configured
  if (!apiKey && !vercelCronSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: no API key set" },
      { status: 500 }
    );
  }

  const isAuthed =
    (apiKey && authHeader === `Bearer ${apiKey}`) ||
    (vercelCronSecret && cronSecret === vercelCronSecret) ||
    (adminKey && adminKeyHeader === adminKey);

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

const ADMIN_API_KEY_HEADER = "x-admin-key";

/**
 * Validate admin API key on admin-only endpoints.
 * Uses ADMIN_API_KEY env var, falling back to INGEST_API_KEY.
 */
export function requireAdminAuth(request: NextRequest): NextResponse | null {
  const adminKey =
    process.env.ADMIN_API_KEY?.trim() || process.env.INGEST_API_KEY?.trim();

  if (!adminKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: no admin key set" },
      { status: 500 }
    );
  }

  const provided =
    request.headers.get(ADMIN_API_KEY_HEADER) ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}
