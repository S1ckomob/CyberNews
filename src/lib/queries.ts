import { getSupabase } from "./supabase";
import type { Article, ThreatActor } from "./types";
import type { ArticleRow, ThreatActorRow } from "./supabase";

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    threatLevel: row.threat_level,
    category: row.category as Article["category"],
    cves: row.cves,
    affectedProducts: row.affected_products,
    threatActors: row.threat_actors,
    industries: row.industries as Article["industries"],
    attackVector: row.attack_vector,
    source: row.source,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    discoveredAt: row.discovered_at ?? "",
    exploitedAt: row.exploited_at ?? undefined,
    patchedAt: row.patched_at ?? undefined,
    verified: row.verified,
    verifiedBy: row.verified_by,
    tags: row.tags,
    region: row.region,
  };
}

function rowToThreatActor(row: ThreatActorRow): ThreatActor {
  return {
    id: row.id,
    name: row.name,
    aliases: row.aliases,
    origin: row.origin,
    description: row.description,
    targetIndustries: row.target_industries as ThreatActor["targetIndustries"],
    firstSeen: row.first_seen,
    lastActive: row.last_active,
    ttps: row.ttps,
  };
}

export async function fetchArticles(): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
  return data.map(rowToArticle);
}

export async function fetchArticlesLimited(limit = 30): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data.map(rowToArticle);
}

export async function fetchArticleBySlug(
  slug: string
): Promise<Article | null> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToArticle(data);
}

export async function fetchArticlesByIndustry(
  industry: string
): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .contains("industries", [industry])
    .order("published_at", { ascending: false });

  if (error) return [];
  return data.map(rowToArticle);
}

export async function fetchThreatActors(): Promise<ThreatActor[]> {
  const { data, error } = await getSupabase()
    .from("threat_actors")
    .select("*")
    .order("last_active", { ascending: false });

  if (error) return [];
  return data.map(rowToThreatActor);
}

export async function fetchThreatActorById(
  id: string
): Promise<ThreatActor | null> {
  const { data, error } = await getSupabase()
    .from("threat_actors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToThreatActor(data);
}

export async function fetchArticleSlugs(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("slug");

  if (error || !data) return [];
  return (data as { slug: string }[]).map((r) => r.slug);
}

export async function fetchThreatActorIds(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("threat_actors")
    .select("id");

  if (error || !data) return [];
  return (data as { id: string }[]).map((r) => r.id);
}
