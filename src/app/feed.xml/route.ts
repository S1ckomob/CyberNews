import { getSupabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cyber-news-five.vercel.app";

export async function GET() {
  const { data } = await getSupabase()
    .from("articles")
    .select("title, slug, summary, threat_level, category, source, published_at, cves, tags")
    .order("published_at", { ascending: false })
    .limit(50);

  const articles = data || [];

  const items = articles.map((a: Record<string, unknown>) => {
    const cves = (a.cves as string[]).length > 0
      ? `<p>CVEs: ${(a.cves as string[]).join(", ")}</p>`
      : "";
    return `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${SITE_URL}/article/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/article/${a.slug}</guid>
      <pubDate>${new Date(a.published_at as string).toUTCString()}</pubDate>
      <description><![CDATA[${a.summary}${cves}]]></description>
      <category>${(a.threat_level as string).toUpperCase()}</category>
      <category>${a.category}</category>
      <source url="${SITE_URL}">${a.source}</source>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Security Standard — Cybersecurity Threat Intelligence</title>
    <link>${SITE_URL}</link>
    <description>Real-time cybersecurity threat intelligence. Verified sources. Actionable data.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <ttl>5</ttl>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate",
    },
  });
}
