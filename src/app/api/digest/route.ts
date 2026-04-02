import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireApiAuth } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(articles: DigestArticle[], date: string) {
  const criticalArticles = articles.filter((a) => a.threat_level === "critical");
  const highArticles = articles.filter((a) => a.threat_level === "high");
  const otherArticles = articles.filter((a) => a.threat_level !== "critical" && a.threat_level !== "high");

  function articleRow(a: DigestArticle) {
    const safeCves = a.cves.slice(0, 2).map(escapeHtml).join(", ");
    const cveText = a.cves.length > 0 ? `<span style="font-family:monospace;color:#ea580c;font-size:12px">${safeCves}</span><br/>` : "";
    const safeTitle = escapeHtml(a.title);
    const safeSummary = escapeHtml(a.summary.slice(0, 200)) + (a.summary.length > 200 ? "..." : "");
    const safeSource = escapeHtml(a.source);
    const safeCategory = escapeHtml(a.category.replace("-", " "));
    const safeSlug = encodeURIComponent(a.slug);
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:monospace;letter-spacing:0.05em;color:${threatColor(a.threat_level)};background:${threatColor(a.threat_level)}15;border:1px solid ${threatColor(a.threat_level)}30">${threatLabel(a.threat_level)}</span>
          <span style="margin-left:8px;font-size:11px;color:#64748b;font-family:monospace">${safeCategory}</span>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com"}/article/${safeSlug}" style="color:#e2e8f0;text-decoration:none;font-size:14px;font-weight:600;line-height:1.4">${safeTitle}</a>
          <br/>
          ${cveText}
          <span style="font-size:12px;color:#94a3b8;line-height:1.5">${safeSummary}</span>
          <br/>
          <span style="font-size:11px;color:#64748b">${safeSource} &middot; ${new Date(a.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
    <td><span style="font-size:16px;font-weight:700;color:#e2e8f0">🛡 Security Intel Hub Daily Briefing</span></td>
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
  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com"}/intelligence" style="color:#3b82f6;text-decoration:none;font-size:13px;font-weight:600">Open Full Dashboard →</a>
  <br/>
  <span style="font-size:11px;color:#475569;line-height:2">Security Intel Hub — Institutional Cybersecurity Intelligence</span>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "heavy");
  if (rateLimitError) return rateLimitError;

  // Auth: require Bearer token or Vercel CRON_SECRET
  const authError = requireApiAuth(request);
  if (authError) return authError;

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

  // Load alert rules to personalize digests
  const { data: alertRules } = await supabase
    .from("alert_rules")
    .select("email, severity, categories")
    .eq("active", true);

  const rulesByEmail = new Map<string, { severity: string[]; categories: string[] }>();
  if (alertRules) {
    for (const rule of alertRules) {
      const r = rule as { email: string; severity: string[]; categories: string[] };
      rulesByEmail.set(r.email, { severity: r.severity || [], categories: r.categories || [] });
    }
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const allArticles = articles as DigestArticle[];
  const results = { sent: 0, failed: 0, personalized: 0, errors: [] as string[] };

  // Send personalized digests per subscriber
  const emails = subscribers.map((s) => (s as { email: string }).email);
  const batchSize = 50;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    for (const email of batch) {
      // Filter articles based on subscriber's preferences
      const rule = rulesByEmail.get(email);
      let personalizedArticles = allArticles;

      if (rule) {
        personalizedArticles = allArticles.filter((a) => {
          // Filter by severity if set
          if (rule.severity.length > 0 && !rule.severity.includes(a.threat_level)) return false;
          // Filter by category if set
          if (rule.categories.length > 0 && !rule.categories.includes(a.category)) return false;
          return true;
        });
        if (personalizedArticles.length > 0) results.personalized++;
      }

      // Skip if no matching articles for this subscriber
      if (personalizedArticles.length === 0) continue;

      const html = buildEmailHtml(personalizedArticles, date);

      try {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Security Intel Hub <digest@securityintelhub.dev>",
          to: email,
          subject: `Security Intel Hub Daily Briefing — ${personalizedArticles.length} threats | ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          html,
        });
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${email}: ${(err as Error).message}`);
      }
    }
  }

  logAudit(request, "digest.send", { articles: articles.length, subscribers: emails.length, sent: results.sent });

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
