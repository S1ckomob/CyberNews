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

function buildAlertEmail(articles: AlertArticle[], rule: AlertRule): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";
  const matchDesc = [
    ...rule.products.map((p) => p),
    ...rule.actors.map((a) => a),
  ].join(", ") || rule.severity.join(", ") + " severity";

  const rows = articles.map((a) => {
    const emoji = LEVEL_EMOJI[a.threat_level] || "⚪";
    const cves = a.cves.length > 0 ? `<br/><span style="font-family:monospace;color:#ea580c;font-size:12px">${a.cves.slice(0, 3).join(" ")}</span>` : "";
    return `
    <tr><td style="padding:12px 0;border-bottom:1px solid #1e293b">
      <span style="font-size:14px">${emoji}</span>
      <span style="font-size:11px;font-weight:700;font-family:monospace;letter-spacing:0.05em;text-transform:uppercase;color:${a.threat_level === "critical" ? "#dc2626" : a.threat_level === "high" ? "#ea580c" : "#ca8a04"}">${a.threat_level}</span>
      <br/>
      <a href="${appUrl}/article/${a.slug}" style="color:#e2e8f0;text-decoration:none;font-size:14px;font-weight:600;line-height:1.4">${a.title}</a>
      ${cves}
      <br/>
      <span style="font-size:12px;color:#94a3b8">${a.summary.slice(0, 150)}${a.summary.length > 150 ? "..." : ""}</span>
      <br/>
      <span style="font-size:11px;color:#64748b">${a.source}</span>
    </td></tr>`;
  }).join("");

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a">
<tr><td align="center" style="padding:20px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b">
<tr><td style="padding:20px 24px 12px">
  <span style="font-size:14px;font-weight:700;color:#e2e8f0">🚨 Security Intel Hub Alert</span>
  <br/>
  <span style="font-size:12px;color:#94a3b8">${articles.length} new threat${articles.length !== 1 ? "s" : ""} matching: ${matchDesc}</span>
</td></tr>
<tr><td style="padding:0 24px 20px">
<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</td></tr>
<tr><td style="padding:12px 24px;border-top:1px solid #1e293b;text-align:center">
  <a href="${appUrl}/intelligence" style="color:#3b82f6;text-decoration:none;font-size:12px;font-weight:600">View All Intelligence →</a>
  <br/>
  <a href="${appUrl}/alerts" style="color:#64748b;text-decoration:none;font-size:10px">Manage alert settings</a>
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
