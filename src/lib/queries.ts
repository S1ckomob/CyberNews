import { unstable_cache } from "next/cache";
import { getSupabase, ARTICLE_LIST_COLUMNS } from "./supabase";
import type { Article, ThreatActor } from "./types";
import type { ArticleListRow, ThreatActorRow } from "./supabase";

// Egress note: `articles` holds 20k+ rows and `content` is ~80% of each row's
// bytes. Every helper here selects ARTICLE_LIST_COLUMNS (no `content`) and
// applies a limit, except fetchArticleBySlug which is the one place the full
// body is rendered. List helpers return Article with `content: ""`.

function rowToArticle(row: ArticleListRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content ?? "",
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

// The most recent 1000 articles (PostgREST's max-rows cap, i.e. the same set
// the old unbounded select actually returned), without `content`, cached for
// 60s so every ISR revalidation across the site shares one Supabase fetch.
const ARTICLE_INDEX_LIMIT = 1000;

export const fetchArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const { data, error } = await getSupabase()
      .from("articles")
      .select(ARTICLE_LIST_COLUMNS)
      .order("published_at", { ascending: false })
      .limit(ARTICLE_INDEX_LIMIT);

    if (error) {
      console.error("Error fetching articles:", error);
      return [];
    }
    return (data as ArticleListRow[]).map(rowToArticle);
  },
  ["articles-index"],
  { revalidate: 60, tags: ["articles"] }
);

export async function fetchArticlesLimited(limit = 30): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select(ARTICLE_LIST_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as ArticleListRow[]).map(rowToArticle);
}

// The only full-row read: the article page renders `content`.
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
  industry: string,
  limit = 200
): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select(ARTICLE_LIST_COLUMNS)
    .contains("industries", [industry])
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as ArticleListRow[]).map(rowToArticle);
}

// Articles tagged with a CVE id (stored uppercased; both cases are matched).
export async function fetchArticlesByCve(
  cveId: string,
  limit = 50
): Promise<Article[]> {
  const ids = [...new Set([cveId.toUpperCase(), cveId.toLowerCase(), cveId])];
  const { data, error } = await getSupabase()
    .from("articles")
    .select(ARTICLE_LIST_COLUMNS)
    .overlaps("cves", ids)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as ArticleListRow[]).map(rowToArticle);
}

// Articles attributed to any of the given actor names/aliases.
export async function fetchArticlesByActor(
  names: string[],
  limit = 100
): Promise<Article[]> {
  const wanted = names.filter(Boolean);
  if (wanted.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("articles")
    .select(ARTICLE_LIST_COLUMNS)
    .overlaps("threat_actors", wanted)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as ArticleListRow[]).map(rowToArticle);
}

// "Related" = shares a CVE, threat actor or affected product, else same
// category — the same criteria the article page used to apply in memory over
// the whole table. Runs as a few tiny targeted queries, newest first, merged
// in that priority order and deduped.
export async function fetchRelatedArticles(
  article: Article,
  limit = 3
): Promise<Article[]> {
  const base = () =>
    getSupabase()
      .from("articles")
      .select(ARTICLE_LIST_COLUMNS)
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(limit);

  const queries: PromiseLike<{ data: unknown; error: unknown }>[] = [];
  if (article.cves.length) queries.push(base().overlaps("cves", article.cves));
  const actors = article.threatActors.filter(Boolean);
  if (actors.length) queries.push(base().overlaps("threat_actors", actors));
  const products = article.affectedProducts.filter(Boolean);
  if (products.length)
    queries.push(base().overlaps("affected_products", products));
  queries.push(base().eq("category", article.category));

  const results = await Promise.all(queries);
  const seen = new Set<string>();
  const related: Article[] = [];
  for (const { data, error } of results) {
    if (error || !data) continue;
    for (const row of data as ArticleListRow[]) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      related.push(rowToArticle(row));
      if (related.length >= limit) return related;
    }
  }
  return related;
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
