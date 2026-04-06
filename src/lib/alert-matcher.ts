import { Resend } from "resend";
import { getSupabaseAdmin } from "./supabase-server";

interface AlertArticle {
  title: string;
  slug: string;
  threat_level: string;
  category: string;
  cves: string[];
  affected_products: string[];
  threat_actors: string[];
  source: string;
  summary: string;
}

interface AlertRule {
  email: string;
  products: string[];
  actors: string[];
  severity: string[];
  categories: string[];
  active: boolean;
}

const LEVEL_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "⚪",
};

function articleMatchesRule(article: AlertArticle, rule: AlertRule): boolean {
  // Check severity
  if (!rule.severity.includes(article.threat_level)) return false;

  // Check categories if specified
  if (rule.categories && rule.categories.length > 0) {
    if (!rule.categories.includes(article.category)) return false;
  }

  // If no products or actors specified, match on severity (and category if set)
  if (rule.products.length === 0 && rule.actors.length === 0) return true;

  const text = `${article.title} ${article.affected_products.join(" ")} ${article.summary}`.toLowerCase();

  // Check products
  if (rule.products.some((p) => text.includes(p.toLowerCase()))) return true;

  // Check actors
  if (rule.actors.some((a) =>
    article.threat_actors.some((ta) => ta.toLowerCase().includes(a.toLowerCase()))
  )) return true;

  return false;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function threatColor(level: string): string {
  switch (level) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#ca8a04";
    default: return "#6b7280";
  }
}

function buildAlertEmail(articles: AlertArticle[], rule: AlertRule): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";
  const matchDesc = escapeHtml(
    [...rule.products, ...rule.actors].join(", ") || rule.severity.join(", ") + " severity"
  );

  const criticalCount = articles.filter((a) => a.threat_level === "critical").length;
  const highCount = articles.filter((a) => a.threat_level === "high").length;

  const rows = articles.map((a) => {
    const color = threatColor(a.threat_level);
    const safeTitle = escapeHtml(a.title);
    const safeSummary = escapeHtml(a.summary.slice(0, 180)) + (a.summary.length > 180 ? "..." : "");
    const safeSource = escapeHtml(a.source);
    const safeSlug = encodeURIComponent(a.slug);
    const cveHtml = a.cves.length > 0
      ? `<div style="margin-top:4px"><span style="font-family:monospace;font-size:11px;color:#ea580c;background:#ea580c10;padding:2px 6px;border-radius:3px;border:1px solid #ea580c30">${a.cves.slice(0, 3).map(escapeHtml).join("</span> <span style=\"font-family:monospace;font-size:11px;color:#ea580c;background:#ea580c10;padding:2px 6px;border-radius:3px;border:1px solid #ea580c30\">")}</span></div>`
      : "";
    const actorHtml = a.threat_actors.length > 0
      ? `<div style="margin-top:4px;font-size:11px;color:#94a3b8">Actors: <strong style="color:#e2e8f0">${a.threat_actors.slice(0, 3).map(escapeHtml).join(", ")}</strong></div>`
      : "";

    return `
    <tr><td style="padding:16px 0;border-bottom:1px solid #1e293b">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="4" style="background:${color};border-radius:2px"></td>
        <td style="padding-left:12px">
          <div style="margin-bottom:6px">
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;letter-spacing:0.05em;text-transform:uppercase;color:${color};background:${color}15;border:1px solid ${color}30">${escapeHtml(a.threat_level)}</span>
            <span style="margin-left:8px;font-size:11px;color:#64748b;font-family:monospace">${escapeHtml(a.category.replace("-", " "))}</span>
          </div>
          <a href="${appUrl}/article/${safeSlug}" style="color:#e2e8f0;text-decoration:none;font-size:15px;font-weight:600;line-height:1.4">${safeTitle}</a>
          ${cveHtml}
          ${actorHtml}
          <div style="margin-top:6px;font-size:12px;color:#94a3b8;line-height:1.5">${safeSummary}</div>
          <div style="margin-top:6px;font-size:11px;color:#64748b">${safeSource} · <a href="${appUrl}/article/${safeSlug}" style="color:#3b82f6;text-decoration:none">Read more →</a></div>
        </td>
      </tr></table>
    </td></tr>`;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a">
<tr><td align="center" style="padding:24px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:10px;border:1px solid #1e293b;overflow:hidden">

<!-- Brand Header -->
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:24px 28px 20px">
  <table width="100%"><tr>
    <td>
      <div style="font-size:18px;font-weight:700;color:#e2e8f0;letter-spacing:-0.02em">🛡 Security Intel Hub</div>
      <div style="margin-top:4px;font-size:12px;color:#64748b">Threat Alert · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
    </td>
    <td align="right">
      <div style="display:inline-block;background:#dc262620;border:1px solid #dc262640;border-radius:6px;padding:6px 12px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#dc2626;font-weight:700">ALERT</div>
      </div>
    </td>
  </tr></table>
</td></tr>

<!-- Summary Bar -->
<tr><td style="padding:0 28px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:8px;margin-top:0">
    <tr>
      <td width="33%" style="padding:14px 12px;text-align:center;border-right:1px solid #334155">
        <div style="font-size:22px;font-weight:700;font-family:monospace;color:#dc2626">${criticalCount}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-top:2px">Critical</div>
      </td>
      <td width="33%" style="padding:14px 12px;text-align:center;border-right:1px solid #334155">
        <div style="font-size:22px;font-weight:700;font-family:monospace;color:#ea580c">${highCount}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-top:2px">High</div>
      </td>
      <td width="34%" style="padding:14px 12px;text-align:center">
        <div style="font-size:22px;font-weight:700;font-family:monospace;color:#3b82f6">${articles.length}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-top:2px">Total</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Match Description -->
<tr><td style="padding:16px 28px 4px">
  <div style="font-size:12px;color:#94a3b8">
    ${articles.length} new threat${articles.length !== 1 ? "s" : ""} matching your alert rules: <strong style="color:#e2e8f0">${matchDesc}</strong>
  </div>
</td></tr>

<!-- Articles -->
<tr><td style="padding:8px 28px 24px">
<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:0 28px 24px" align="center">
  <a href="${appUrl}/intelligence" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 28px;border-radius:6px;letter-spacing:0.01em">View Full Dashboard →</a>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 28px;border-top:1px solid #1e293b;background:#0c1222">
  <table width="100%"><tr>
    <td style="font-size:11px;color:#475569;line-height:1.6">
      Security Intel Hub — Institutional Cybersecurity Intelligence<br/>
      <a href="${appUrl}/alerts" style="color:#64748b;text-decoration:none">Manage alert settings</a> · <a href="${appUrl}/help" style="color:#64748b;text-decoration:none">Help</a> · <a href="${appUrl}/api/unsubscribe?email=${encodeURIComponent(rule.email)}" style="color:#64748b;text-decoration:none">Unsubscribe</a>
    </td>
  </tr></table>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export async function sendPersonalizedAlerts(newArticles: AlertArticle[]) {
  if (!process.env.RESEND_API_KEY || newArticles.length === 0) return { sent: 0 };

  const supabase = getSupabaseAdmin();
  const { data: rules } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("active", true);

  if (!rules || rules.length === 0) return { sent: 0 };

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;

  for (const rule of rules as AlertRule[]) {
    const matches = newArticles.filter((a) => articleMatchesRule(a, rule));
    if (matches.length === 0) continue;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Security Intel Hub <alerts@securityintelhub.dev>",
        to: rule.email,
        subject: `🚨 ${matches.length} new threat${matches.length !== 1 ? "s" : ""} matching your alerts — ${matches[0].title.slice(0, 60)}`,
        html: buildAlertEmail(matches, rule),
      });
      sent++;
    } catch (err) {
      console.error(`Alert email failed for ${rule.email}:`, err);
    }
  }

  return { sent, rules: rules.length };
}
