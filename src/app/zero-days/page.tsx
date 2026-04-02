"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import type { ArticleRow } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Bug,
  AlertTriangle,
  Shield,
  Clock,
  Crosshair,
  Target,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

export default function ZeroDaysPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<ThreatLevel[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("articles").select("*").order("published_at", { ascending: false })
      .then(({ data }) => { if (data) setArticles(data.map(rowToArticle)); setLoading(false); });
  }, []);

  // Zero-days: category is zero-day, or tags include zero-day, or title mentions it
  const zeroDays = useMemo(() => articles.filter(
    (a) =>
      a.category === "zero-day" ||
      a.tags.some((t) => t.includes("zero-day") || t.includes("0-day")) ||
      a.title.toLowerCase().includes("zero-day") ||
      a.title.toLowerCase().includes("0-day")
  ), [articles]);

  // Actively exploited: any article mentioning active exploitation
  const activelyExploited = useMemo(() => articles.filter(
    (a) =>
      a.exploitedAt ||
      a.tags.some((t) =>
        t.includes("active-exploitation") || t.includes("mass-exploitation")
      ) ||
      a.summary.toLowerCase().includes("actively exploited") ||
      a.summary.toLowerCase().includes("exploitation in the wild")
  ), [articles]);

  // Deduplicate
  const allRelevant = useMemo(() => {
    const combinedIds = new Set([...zeroDays.map((a) => a.id), ...activelyExploited.map((a) => a.id)]);
    return articles.filter((a) => combinedIds.has(a.id));
  }, [articles, zeroDays, activelyExploited]);

  // Available products for filter
  const allProducts = useMemo(() => [...new Set(allRelevant.flatMap((a) => a.affectedProducts))], [allRelevant]);

  // Filter logic
  const toggleSeverity = (level: ThreatLevel) => {
    setSeverityFilters((prev) =>
      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
    );
  };
  const toggleProduct = (product: string) => {
    setProductFilter((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  };
  const activeFilterCount = severityFilters.length + productFilter.length;
  const clearFilters = () => { setSeverityFilters([]); setProductFilter([]); setSearch(""); };

  // Apply filters
  const filtered = useMemo(() => {
    let list = allRelevant;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.cves.some((c) => c.toLowerCase().includes(q)) ||
        a.affectedProducts.some((p) => p.toLowerCase().includes(q))
      );
    }
    if (severityFilters.length > 0) {
      list = list.filter((a) => severityFilters.includes(a.threatLevel));
    }
    if (productFilter.length > 0) {
      list = list.filter((a) => a.affectedProducts.some((p) => productFilter.includes(p)));
    }
    return list;
  }, [allRelevant, search, severityFilters, productFilter]);

  // Derive sections from filtered list
  const filteredActivelyExploited = useMemo(() => {
    const activeIds = new Set(activelyExploited.map((a) => a.id));
    return filtered.filter((a) => activeIds.has(a.id));
  }, [filtered, activelyExploited]);

  const filteredZeroDayOnly = useMemo(() => {
    const activeIds = new Set(activelyExploited.map((a) => a.id));
    const zdIds = new Set(zeroDays.map((a) => a.id));
    return filtered.filter((a) => zdIds.has(a.id) && !activeIds.has(a.id));
  }, [filtered, zeroDays, activelyExploited]);

  const allCves = useMemo(() => [...new Set(filtered.flatMap((a) => a.cves))], [filtered]);
  const criticalCount = useMemo(() => filtered.filter((a) => a.threatLevel === "critical").length, [filtered]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Bug className="h-6 w-6 text-threat-critical" />
          <h1 className="text-2xl font-bold tracking-tight">Zero-Day Tracker</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Bug className="h-6 w-6 text-threat-critical" />
        <h1 className="text-2xl font-bold tracking-tight">
          Zero-Day Tracker
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Actively exploited zero-day vulnerabilities and in-the-wild exploitation
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card className="border-threat-critical/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {filtered.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Active Threats
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-high">
              {filteredZeroDayOnly.length + filteredActivelyExploited.filter((a) => zeroDays.some((z) => z.id === a.id)).length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Zero-Days
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {allCves.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              CVEs
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {criticalCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Critical Severity
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search zero-days, CVEs, products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn("gap-1.5", showFilters && "bg-accent")}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">{activeFilterCount}</Badge>}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Severity</h4>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITY_OPTIONS.map((level) => (
                  <Badge
                    key={level}
                    variant={severityFilters.includes(level) ? "default" : "outline"}
                    className={cn("cursor-pointer capitalize", severityFilters.includes(level) && `bg-threat-${level} hover:bg-threat-${level}/80`)}
                    onClick={() => toggleSeverity(level)}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Affected Products</h4>
              <div className="flex flex-wrap gap-1.5">
                {allProducts.slice(0, 20).map((product) => (
                  <Badge
                    key={product}
                    variant={productFilter.includes(product) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleProduct(product)}
                  >
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Actively Exploited - Top Priority */}
          {filteredActivelyExploited.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical animate-threat-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
                  Actively Exploited ({filteredActivelyExploited.length})
                </h2>
              </div>
              <div className="space-y-3">
                {filteredActivelyExploited.slice(0, 3).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
                {filteredActivelyExploited.slice(3).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          {/* Zero-Day Only (not also in actively exploited) */}
          {filteredZeroDayOnly.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="h-4 w-4 text-threat-high" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Zero-Day Vulnerabilities
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredZeroDayOnly.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No matching zero-day articles found.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Affected Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Affected Products
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allProducts.slice(0, 20).map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CVEs */}
          {allCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crosshair className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Zero-Day CVEs ({allCves.length})
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {allCves.slice(0, 12).map((cve) => (
                    <a
                      key={cve}
                      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-threat-critical" />
                      {cve}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                {filtered.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-critical shrink-0" />
                    <span className="line-clamp-2">{a.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
