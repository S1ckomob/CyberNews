"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import { Search, Tag, AlertTriangle, ExternalLink, Box } from "lucide-react";

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

interface CveEntry {
  cve: string;
  articles: Article[];
  highestThreat: Article["threatLevel"];
  products: string[];
}

export default function CvePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data.map(rowToArticle));
        setLoading(false);
      });
  }, []);

  const cveMap = useMemo(() => {
    const map = new Map<string, CveEntry>();
    for (const article of articles) {
      for (const cve of article.cves) {
        if (!map.has(cve)) {
          map.set(cve, {
            cve,
            articles: [],
            highestThreat: "low",
            products: [],
          });
        }
        const entry = map.get(cve)!;
        entry.articles.push(article);
        const levels = ["critical", "high", "medium", "low"] as const;
        if (
          levels.indexOf(article.threatLevel) <
          levels.indexOf(entry.highestThreat)
        ) {
          entry.highestThreat = article.threatLevel;
        }
        for (const p of article.affectedProducts) {
          if (!entry.products.includes(p)) entry.products.push(p);
        }
      }
    }
    return Array.from(map.values());
  }, []);

  const filtered = useMemo(() => {
    if (!search) return cveMap;
    const q = search.toLowerCase();
    return cveMap.filter(
      (e) =>
        e.cve.toLowerCase().includes(q) ||
        e.products.some((p) => p.toLowerCase().includes(q))
    );
  }, [search, cveMap]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">CVE Search</h1>
        <p className="text-sm text-muted-foreground">
          Search and track Common Vulnerabilities and Exposures
        </p>
      </div>

      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search CVE IDs or affected products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold">No CVEs found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.cve} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-threat-high" />
                      <span className="font-mono text-base font-bold">
                        {entry.cve}
                      </span>
                      <ThreatBadge level={entry.highestThreat} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Box className="h-3 w-3 text-muted-foreground" />
                      {entry.products.map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-xs"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Referenced in {entry.articles.length}{" "}
                      {entry.articles.length === 1
                        ? "article"
                        : "articles"}
                    </div>
                    <div className="space-y-1">
                      {entry.articles.map((a) => (
                        <Link
                          key={a.id}
                          href={`/article/${a.slug}`}
                          className="block text-sm text-primary hover:underline"
                        >
                          {a.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${entry.cve}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
