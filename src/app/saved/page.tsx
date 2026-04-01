"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import { getSavedSlugs } from "@/lib/saved-articles";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import { Bookmark } from "lucide-react";

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id, title: row.title, slug: row.slug, summary: row.summary,
    content: row.content, threatLevel: row.threat_level,
    category: row.category as Article["category"], cves: row.cves,
    affectedProducts: row.affected_products, threatActors: row.threat_actors,
    industries: row.industries as Article["industries"],
    attackVector: row.attack_vector, source: row.source, sourceUrl: row.source_url,
    publishedAt: row.published_at, updatedAt: row.updated_at,
    discoveredAt: row.discovered_at ?? "", exploitedAt: row.exploited_at ?? undefined,
    patchedAt: row.patched_at ?? undefined, verified: row.verified,
    verifiedBy: row.verified_by, tags: row.tags, region: row.region,
  };
}

export default function SavedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slugs = getSavedSlugs();
    if (slugs.length === 0) {
      setLoading(false);
      return;
    }
    supabase
      .from("articles")
      .select("*")
      .in("slug", slugs)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map(rowToArticle);
          // Preserve saved order
          const ordered = slugs
            .map((s) => mapped.find((a) => a.slug === s))
            .filter((a): a is Article => !!a);
          setArticles(ordered);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Saved Articles</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Articles you've bookmarked for later. Stored locally in your browser.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold">No saved articles</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Click the Save button on any article to bookmark it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
