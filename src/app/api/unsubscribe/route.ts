import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isValidEmail } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/unsubscribe?email=xxx — one-click unsubscribe (CAN-SPAM compliant)
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email || !isValidEmail(email)) {
    return new NextResponse(unsubscribePage("Invalid email address.", false), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  // Deactivate subscriber
  await supabase
    .from("subscribers")
    .update({ active: false })
    .eq("email", normalizedEmail);

  // Deactivate alert rules
  await supabase
    .from("alert_rules")
    .update({ active: false })
    .eq("email", normalizedEmail);

  logAudit(request, "subscriber.add", { action: "unsubscribe", email: normalizedEmail });

  return new NextResponse(unsubscribePage(normalizedEmail, true), {
    headers: { "Content-Type": "text/html" },
  });
}

function unsubscribePage(emailOrError: string, success: boolean): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Unsubscribe — Security Intel Hub</title></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;max-width:400px;padding:40px">
  <div style="font-size:24px;font-weight:700;color:#e2e8f0;margin-bottom:16px">🛡 Security Intel Hub</div>
  ${success
    ? `<div style="font-size:16px;color:#22c55e;font-weight:600;margin-bottom:8px">✓ Unsubscribed</div>
       <p style="color:#94a3b8;font-size:14px;line-height:1.6">${emailOrError} has been removed from all email alerts and daily briefings.</p>
       <p style="color:#64748b;font-size:12px;margin-top:16px">You can re-subscribe anytime at <a href="${appUrl}" style="color:#3b82f6;text-decoration:none">${appUrl}</a></p>`
    : `<div style="font-size:16px;color:#dc2626;font-weight:600;margin-bottom:8px">Error</div>
       <p style="color:#94a3b8;font-size:14px">${emailOrError}</p>`}
</div>
</body>
</html>`;
}
