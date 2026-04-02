import { NextRequest, NextResponse } from "next/server";
import { generateCsrfToken, CSRF_COOKIE } from "@/lib/csrf";

export function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  // Admin gate
  if (isAdmin) {
    const adminKey =
      process.env.ADMIN_API_KEY?.trim() || process.env.INGEST_API_KEY?.trim();

    if (!adminKey) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 503 }
      );
    }

    const cookieKey = request.cookies.get("admin-key")?.value;
    const headerKey = request.headers.get("x-admin-key");

    if (cookieKey !== adminKey && headerKey !== adminKey) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const response = NextResponse.next();

  // Set CSRF cookie if not present
  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      httpOnly: false, // Client JS must read this to send as header
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all pages and API routes except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
