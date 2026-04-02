import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "public");
  if (rateLimitError) return rateLimitError;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 200) {
    return NextResponse.json({ articles: [], actors: [], cves: [] });
  }

  const supabase = getSupabase();
  const pattern = `%${q}%`;

  const [articlesRes, actorsRes] = await Promise.all([
    supabase
      .from("articles")
      .select("title, slug, threat_level, source, cves")
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .order("published_at", { ascending: false })
      .limit(6),
    supabase
      .from("threat_actors")
      .select("id, name, origin, aliases")
      .or(`name.ilike.${pattern}`)
      .limit(5),
  ]);

  // Extract matching CVEs from articles
  const cves: { cve: string; articleTitle: string; slug: string }[] = [];
  const seen = new Set<string>();
  for (const a of articlesRes.data || []) {
    const article = a as { title: string; slug: string; cves: string[] };
    for (const cve of article.cves) {
      if (cve.toLowerCase().includes(q.toLowerCase()) && !seen.has(cve)) {
        seen.add(cve);
        cves.push({ cve, articleTitle: article.title, slug: article.slug });
      }
    }
  }

  return NextResponse.json({
    articles: (articlesRes.data || []).map((a: Record<string, unknown>) => ({
      title: a.title,
      slug: a.slug,
      threat_level: a.threat_level,
      source: a.source,
    })),
    actors: (actorsRes.data || []).map((a: Record<string, unknown>) => ({
      id: a.id,
      name: a.name,
      origin: a.origin,
    })),
    cves: cves.slice(0, 5),
  });
}
