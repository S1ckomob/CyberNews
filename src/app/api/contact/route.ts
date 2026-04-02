import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { isValidEmail } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "public");
  if (rateLimitError) return rateLimitError;

  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, subject, message } = body as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "Name is required (max 100 chars)" }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!subject || typeof subject !== "string" || subject.length > 200) {
    return NextResponse.json({ error: "Subject is required (max 200 chars)" }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.length < 10 || message.length > 5000) {
    return NextResponse.json({ error: "Message is required (10-5000 chars)" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const toEmail = process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL?.match(/<(.+)>/)?.[1] || "admin@securityintelhub.dev";

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Security Intel Hub <noreply@securityintelhub.dev>",
      to: toEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px">
          <h2 style="margin:0 0 16px">New Contact Form Submission</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px 12px;font-weight:bold;color:#666;width:80px">From</td><td style="padding:8px 12px">${name.replace(/</g, "&lt;")} &lt;${email}&gt;</td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#666">Subject</td><td style="padding:8px 12px">${subject.replace(/</g, "&lt;")}</td></tr>
          </table>
          <div style="margin:16px 0;padding:16px;background:#f4f4f5;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.6">${message.replace(/</g, "&lt;")}</div>
          <p style="color:#999;font-size:12px">Sent via Security Intel Hub contact form</p>
        </div>
      `,
    });

    logAudit(request, "subscriber.add", { action: "contact", email, subject });

    return NextResponse.json({ success: true, message: "Message sent. We'll get back to you soon." });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send message. Try again later." }, { status: 500 });
  }
}
