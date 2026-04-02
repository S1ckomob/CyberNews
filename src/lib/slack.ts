interface SlackArticle {
  title: string;
  slug: string;
  threat_level: string;
  category: string;
  cves: string[];
  source: string;
  summary: string;
}

const LEVEL_EMOJI: Record<string, string> = {
  critical: ":red_circle:",
  high: ":orange_circle:",
  medium: ":yellow_circle:",
  low: ":white_circle:",
};

export async function sendSlackAlert(articles: SlackArticle[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || articles.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cyber-news-five.vercel.app";

  // Only alert on critical, high, or zero-day
  const urgent = articles.filter(
    (a) =>
      a.threat_level === "critical" ||
      a.threat_level === "high" ||
      a.category === "zero-day"
  );

  if (urgent.length === 0) return;

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🛡 Security Standard Alert — ${urgent.length} New Threat${urgent.length > 1 ? "s" : ""}`,
      },
    },
  ];

  for (const article of urgent.slice(0, 5)) {
    const emoji = LEVEL_EMOJI[article.threat_level] || ":white_circle:";
    const cveText = article.cves.length > 0 ? `\n\`${article.cves.slice(0, 3).join("` `")}\`` : "";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *${article.threat_level.toUpperCase()}* — <${appUrl}/article/${article.slug}|${article.title}>\n${article.summary.slice(0, 150)}${article.summary.length > 150 ? "..." : ""}${cveText}\n_Source: ${article.source}_`,
      },
    });
  }

  if (urgent.length > 5) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_+${urgent.length - 5} more — <${appUrl}/intelligence|View Dashboard>_`,
      },
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "Open Dashboard" },
        url: `${appUrl}/intelligence`,
      },
      {
        type: "button",
        text: { type: "plain_text", text: "Zero-Days" },
        url: `${appUrl}/zero-days`,
      },
    ],
  });

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
  } catch (err) {
    console.error("Slack webhook error:", err);
  }
}
