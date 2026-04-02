"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { supabase } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Search, Tag, AlertTriangle, ExternalLink, Box,
  SlidersHorizontal, X, Shield, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  actors: string[];
}

const THREAT_LEVELS: ThreatLevel[] = ["critical", "high", "medium", "low"];

export default function CvePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<ThreatLevel[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [actorFilter, setActorFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data.map(rowToArticle));
        setLoading(false);
      });
  }, []);

  // Build CVE map
  const cveMap = useMemo(() => {
    const map = new Map<string, CveEntry>();
    for (const article of articles) {
      for (const cve of article.cves) {
        if (!map.has(cve)) {
          map.set(cve, { cve, articles: [], highestThreat: "low", products: [], actors: [] });
        }
        const entry = map.get(cve)!;
        entry.articles.push(article);
        const levels = ["critical", "high", "medium", "low"] as const;
        if (levels.indexOf(article.threatLevel) < levels.indexOf(entry.highestThreat)) {
          entry.highestThreat = article.threatLevel;
        }
        for (const p of article.affectedProducts) {
          if (!entry.products.includes(p)) entry.products.push(p);
        }
        for (const a of article.threatActors) {
          if (!entry.actors.includes(a)) entry.actors.push(a);
        }
      }
    }
    return Array.from(map.values());
  }, [articles]);

  // Unique products and actors for filter options
  const allProducts = useMemo(() => {
    const set = new Set<string>();
    cveMap.forEach((e) => e.products.forEach((p) => set.add(p)));
    return [...set].sort();
  }, [cveMap]);

  const allActors = useMemo(() => {
    const set = new Set<string>();
    cveMap.forEach((e) => e.actors.forEach((a) => set.add(a)));
    return [...set].sort();
  }, [cveMap]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = cveMap;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.cve.toLowerCase().includes(q) ||
          e.products.some((p) => p.toLowerCase().includes(q)) ||
          e.actors.some((a) => a.toLowerCase().includes(q)) ||
          e.articles.some((a) => a.title.toLowerCase().includes(q))
      );
    }

    if (severityFilters.length > 0) {
      result = result.filter((e) => severityFilters.includes(e.highestThreat));
    }

    if (productFilter.length > 0) {
      result = result.filter((e) =>
        productFilter.some((pf) => e.products.some((p) => p.toLowerCase().includes(pf.toLowerCase())))
      );
    }

    if (actorFilter.length > 0) {
      result = result.filter((e) =>
        actorFilter.some((af) => e.actors.some((a) => a.toLowerCase().includes(af.toLowerCase())))
      );
    }

    return result;
  }, [search, cveMap, severityFilters, productFilter, actorFilter]);

  const activeFilterCount = severityFilters.length + productFilter.length + actorFilter.length;

  function clearAllFilters() {
    setSeverityFilters([]);
    setProductFilter([]);
    setActorFilter([]);
    setSearch("");
  }

  function toggleSeverity(level: ThreatLevel) {
    setSeverityFilters((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }

  function toggleProduct(product: string) {
    setProductFilter((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  }

  function toggleActor(actor: string) {
    setActorFilter((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">CVE Search</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${cveMap.length} CVEs tracked across ${articles.length} articles`}
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search CVE IDs, products, actors, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-1.5", showFilters && "bg-accent")}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            {/* Severity */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Severity
              </h3>
              <div className="flex flex-wrap gap-2">
                {THREAT_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleSeverity(level)}
                    className={cn(
                      "transition-opacity",
                      severityFilters.length > 0 && !severityFilters.includes(level) && "opacity-30"
                    )}
                  >
                    <ThreatBadge level={level} />
                  </button>
                ))}
              </div>
            </div>

            {/* Products / Vendors */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Box className="h-3 w-3" /> Affected Products
                <span className="font-normal opacity-60">({allProducts.length})</span>
              </h3>
              {productFilter.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {productFilter.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs gap-1 pr-1">
                      {p}
                      <button onClick={() => toggleProduct(p)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {allProducts
                  .filter((p) => !productFilter.includes(p))
                  .slice(0, 30)
                  .map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="text-[10px] cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => toggleProduct(p)}
                    >
                      {p}
                    </Badge>
                  ))}
                {allProducts.length > 30 && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{allProducts.length - 30} more — use search to find specific products
                  </span>
                )}
              </div>
            </div>

            {/* Threat Actors */}
            {allActors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Threat Actors
                  <span className="font-normal opacity-60">({allActors.length})</span>
                </h3>
                {actorFilter.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {actorFilter.map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs gap-1 pr-1">
                        {a}
                        <button onClick={() => toggleActor(a)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {allActors
                    .filter((a) => !actorFilter.includes(a))
                    .slice(0, 20)
                    .map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="text-[10px] cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => toggleActor(a)}
                      >
                        {a}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${filtered.length} CVE${filtered.length !== 1 ? "s" : ""}`}
          {activeFilterCount > 0 && ` (filtered from ${cveMap.length})`}
        </p>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold">No CVEs found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFilterCount > 0
                ? "Try removing some filters or broadening your search"
                : "Try a different search term"}
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
                      <Link
                        href={`/cve/${entry.cve}`}
                        className="font-mono text-base font-bold hover:text-primary transition-colors"
                      >
                        {entry.cve}
                      </Link>
                      <ThreatBadge level={entry.highestThreat} size="sm" />
                    </div>
                    {entry.products.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Box className="h-3 w-3 text-muted-foreground shrink-0" />
                        {entry.products.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className={cn(
                              "text-xs cursor-pointer transition-colors",
                              productFilter.includes(p) ? "bg-primary/10 border-primary/30" : "hover:bg-accent"
                            )}
                            onClick={() => toggleProduct(p)}
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {entry.actors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                        {entry.actors.map((a) => (
                          <Badge
                            key={a}
                            variant="outline"
                            className={cn(
                              "text-xs cursor-pointer transition-colors",
                              actorFilter.includes(a) ? "bg-primary/10 border-primary/30" : "hover:bg-accent"
                            )}
                            onClick={() => toggleActor(a)}
                          >
                            {a}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Referenced in {entry.articles.length}{" "}
                      {entry.articles.length === 1 ? "article" : "articles"}
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
                    aria-label={`View ${entry.cve} on NVD`}
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
