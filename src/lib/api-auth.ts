import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Simple in-memory rate tracker for auth failures (resets on cold start)
const authFailures = new Map<string, { count: number; lastAlert: number }>();

function trackAuthFailure(ip: string) {
  const now = Date.now();
  const entry = authFailures.get(ip) || { count: 0, lastAlert: 0 };
  entry.count++;

  // Alert after 10 failures, max once per hour
  if (entry.count >= 10 && now - entry.lastAlert > 3600000) {
    entry.lastAlert = now;
    entry.count = 0;

    // Fire-and-forget alert email
    const resendKey = process.env.RESEND_API_KEY;
    const alertEmail = process.env.CONTACT_EMAIL;
    if (resendKey && alertEmail) {
      const resend = new Resend(resendKey);
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Security Intel Hub <alerts@securityintelhub.com>",
        to: alertEmail,
        subject: `⚠️ Security Alert: Repeated auth failures from ${ip}`,
        html: `<h2>Authentication Failure Alert</h2><p><strong>${ip}</strong> has failed authentication 10+ times in the last hour.</p><p>This may indicate a brute force attempt against your API endpoints.</p><p>Time: ${new Date().toISOString()}</p>`,
      }).catch(() => {});
    }
  }

  authFailures.set(ip, entry);
}

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
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    trackAuthFailure(ip);
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
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    trackAuthFailure(ip);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}
