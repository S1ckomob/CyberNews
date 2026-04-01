import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase-server";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface DigestArticle {
  title: string;
  slug: string;
  summary: string;
  threat_level: string;
  category: string;
  cves: string[];
  source: string;
  published_at: string;
}

function threatColor(level: string) {
  switch (level) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#ca8a04";
    default: return "#6b7280";
  }
}

function threatLabel(level: string) {
  return level.toUpperCase();
}

function buildEmailHtml(articles: DigestArticle[], date: string) {
  const criticalArticles = articles.filter((a) => a.threat_level === "critical");
  const highArticles = articles.filter((a) => a.threat_level === "high");
  const otherArticles = articles.filter((a) => a.threat_level !== "critical" && a.threat_level !== "high");

  function articleRow(a: DigestArticle) {
    const cveText = a.cves.length > 0 ? `<span style="font-family:monospace;color:#ea580c;font-size:12px">${a.cves.slice(0, 2).join(", ")}</span><br/>` : "";
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:monospace;letter-spacing:0.05em;color:${threatColor(a.threat_level)};background:${threatColor(a.threat_level)}15;border:1px solid ${threatColor(a.threat_level)}30">${threatLabel(a.threat_level)}</span>
          <span style="margin-left:8px;font-size:11px;color:#64748b;font-family:monospace">${a.category.replace("-", " ")}</span>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cybernews.vercel.app"}/article/${a.slug}" style="color:#e2e8f0;text-decoration:none;font-size:14px;font-weight:600;line-height:1.4">${a.title}</a>
          <br/>
          ${cveText}
          <span style="font-size:12px;color:#94a3b8;line-height:1.5">${a.summary.slice(0, 200)}${a.summary.length > 200 ? "..." : ""}</span>
          <br/>
          <span style="font-size:11px;color:#64748b">${a.source} &middot; ${new Date(a.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </td>
      </tr>`;
  }

  function section(title: string, items: DigestArticle[], color: string) {
    if (items.length === 0) return "";
    return `
      <tr><td style="padding:20px 0 8px 0">
        <h2 style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${color}">${title} (${items.length})</h2>
      </td></tr>
      ${items.map(articleRow).join("")}`;
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a">
<tr><td align="center" style="padding:20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b">

<!-- Header -->
<tr><td style="padding:24px 24px 16px">
  <table width="100%"><tr>
    <td><span style="font-size:16px;font-weight:700;color:#e2e8f0">🛡 CyberIntel Daily Briefing</span></td>
    <td align="right"><span style="font-size:12px;color:#64748b">${date}</span></td>
  </tr></table>
  <p style="margin:8px 0 0;font-size:13px;color:#94a3b8">Top threats from the last 24 hours. ${articles.length} reports from verified sources.</p>
</td></tr>

<!-- Stats -->
<tr><td style="padding:0 24px 16px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:6px">
    <tr>
      <td width="33%" style="padding:12px;text-align:center;border-right:1px solid #334155">
        <div style="font-size:20px;font-weight:700;font-family:monospace;color:#dc2626">${criticalArticles.length}</div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b">Critical</div>
      </td>
      <td width="33%" style="padding:12px;text-align:center;border-right:1px solid #334155">
        <div style="font-size:20px;font-weight:700;font-family:monospace;color:#ea580c">${highArticles.length}</div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b">High</div>
      </td>
      <td width="34%" style="padding:12px;text-align:center">
        <div style="font-size:20px;font-weight:700;font-family:monospace;color:#3b82f6">${articles.length}</div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b">Total</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Articles -->
<tr><td style="padding:0 24px 24px">
<table width="100%" cellpadding="0" cellspacing="0">
  ${section("Critical Threats", criticalArticles, "#dc2626")}
  ${section("High Severity", highArticles, "#ea580c")}
  ${section("Other Reports", otherArticles, "#94a3b8")}
</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 24px;border-top:1px solid #1e293b;text-align:center">
  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cybernews.vercel.app"}/intelligence" style="color:#3b82f6;text-decoration:none;font-size:13px;font-weight:600">Open Full Dashboard →</a>
  <br/>
  <span style="font-size:11px;color:#475569;line-height:2">CyberIntel — Institutional Cybersecurity Intelligence</span>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGEST_API_KEY?.trim();
  const cronSecret = request.headers.get("x-vercel-cron-secret");
  const vercelCronSecret = process.env.CRON_SECRET?.trim();

  const isAuthed =
    !apiKey ||
    authHeader === `Bearer ${apiKey}` ||
    (vercelCronSecret && cronSecret === vercelCronSecret);

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();

  // Get articles from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: articles } = await supabase
    .from("articles")
    .select("title, slug, summary, threat_level, category, cves, source, published_at")
    .gte("published_at", yesterday.toISOString())
    .order("published_at", { ascending: false });

  if (!articles || articles.length === 0) {
    return NextResponse.json({ success: true, message: "No articles in last 24h, skipping digest" });
  }

  // Get active subscribers
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email")
    .eq("active", true);

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ success: true, message: "No active subscribers" });
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const html = buildEmailHtml(articles as DigestArticle[], date);

  // Send to all subscribers in batches
  const emails = subscribers.map((s) => (s as { email: string }).email);
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  // Resend supports batch sending up to 100 at a time
  const batchSize = 50;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    for (const email of batch) {
      try {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL || "CyberIntel <digest@cyberintel.dev>",
          to: email,
          subject: `CyberIntel Daily Briefing — ${articles.length} threats | ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          html,
        });
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${email}: ${(err as Error).message}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    digest: {
      articles: articles.length,
      critical: articles.filter((a) => a.threat_level === "critical").length,
      subscribers: emails.length,
      sent: results.sent,
      failed: results.failed,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
