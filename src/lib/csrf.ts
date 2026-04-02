import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

/** Generate a cryptographically random CSRF token */
export function generateCsrfToken(): string {
  return randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Validate CSRF token using double-submit cookie pattern.
 * The cookie value must match the x-csrf-token header.
 * Returns null if valid, or a 403 NextResponse if invalid.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: "Missing CSRF token" },
      { status: 403 }
    );
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const cookieBuf = Buffer.from(cookieToken, "utf-8");
    const headerBuf = Buffer.from(headerToken, "utf-8");

    if (cookieBuf.length !== headerBuf.length || !timingSafeEqual(cookieBuf, headerBuf)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  return null;
}

export { CSRF_COOKIE, CSRF_HEADER };
