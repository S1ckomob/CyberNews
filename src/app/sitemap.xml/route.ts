import { getSupabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cyber-news-five.vercel.app";

const STATIC_PAGES = [
  { path: "", priority: "1.0", changefreq: "hourly" },
  { path: "/intelligence", priority: "0.9", changefreq: "hourly" },
  { path: "/briefing", priority: "0.9", changefreq: "daily" },
  { path: "/timeline", priority: "0.8", changefreq: "hourly" },
  { path: "/zero-days", priority: "0.9", changefreq: "hourly" },
  { path: "/ransomware", priority: "0.8", changefreq: "daily" },
  { path: "/firewalls", priority: "0.8", changefreq: "daily" },
  { path: "/windows", priority: "0.8", changefreq: "daily" },
  { path: "/cve", priority: "0.8", changefreq: "daily" },
  { path: "/threat-actors", priority: "0.8", changefreq: "daily" },
  { path: "/trends", priority: "0.7", changefreq: "daily" },
  { path: "/industry", priority: "0.6", changefreq: "weekly" },
  { path: "/watchlist", priority: "0.5", changefreq: "monthly" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/api-docs", priority: "0.5", changefreq: "monthly" },
  { path: "/about", priority: "0.4", changefreq: "monthly" },
];

const INDUSTRIES = [
  "healthcare", "finance", "government", "energy", "retail",
  "technology", "education", "defense", "telecommunications", "manufacturing",
];

export async function GET() {
  const supabase = getSupabase();

  const [articlesRes, actorsRes] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, updated_at")
      .order("published_at", { ascending: false })
      .limit(500),
    supabase
      .from("threat_actors")
      .select("id")
      .limit(100),
  ]);

  const articles = (articlesRes.data || []) as { slug: string; updated_at: string }[];
  const actors = (actorsRes.data || []) as { id: string }[];

  const staticUrls = STATIC_PAGES.map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  ).join("\n");

  const industryUrls = INDUSTRIES.map(
    (ind) => `  <url>
    <loc>${SITE_URL}/industry/${ind}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
  ).join("\n");

  const articleUrls = articles.map(
    (a) => `  <url>
    <loc>${SITE_URL}/article/${a.slug}</loc>
    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  ).join("\n");

  const actorUrls = actors.map(
    (a) => `  <url>
    <loc>${SITE_URL}/threat-actors/${a.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${industryUrls}
${articleUrls}
${actorUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
