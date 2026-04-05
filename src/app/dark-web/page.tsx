"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/article-card";
import { ThreatBadge } from "@/components/threat-badge";
import { supabase } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Search, SlidersHorizontal, X, Shield, AlertTriangle,
  Eye, Lock, Users, Globe, Database, Skull,
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

const DARK_WEB_KEYWORDS = [
  "dark web", "darknet", "leak site", "underground", "tor ",
  "stolen data", "credentials leaked", "data dump", "dark forum",
  "initial access broker", "pwned", "breach", "data leak",
  "ransom leak", "ransomwatch", "darkfeed", "have i been pwned",
  "leaked database", "exposed data", "threat actor forum",
  "coveware", "databreaches", "extortion",
];

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

export default function DarkWebPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<ThreatLevel[]>([]);

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

  // Filter to dark web related articles
  const darkWebArticles = useMemo(() => {
    return articles.filter((a) => {
      const text = `${a.title} ${a.summary} ${a.source} ${a.tags.join(" ")} ${a.category}`.toLowerCase();
      return DARK_WEB_KEYWORDS.some((kw) => text.includes(kw));
    });
  }, [articles]);

  // Apply user filters
  const filtered = useMemo(() => {
    let result = darkWebArticles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.threatActors.some((t) => t.toLowerCase().includes(q)) ||
        a.affectedProducts.some((p) => p.toLowerCase().includes(q))
      );
    }
    if (severityFilters.length > 0) {
      result = result.filter((a) => severityFilters.includes(a.threatLevel));
    }
    return result;
  }, [darkWebArticles, search, severityFilters]);

  // Stats
  const breachCount = darkWebArticles.filter((a) => a.category === "data-breach").length;
  const ransomwareLeaks = darkWebArticles.filter((a) => a.category === "ransomware").length;
  const criticalCount = darkWebArticles.filter((a) => a.threatLevel === "critical").length;
  const actorsInvolved = [...new Set(darkWebArticles.flatMap((a) => a.threatActors).filter(Boolean))];
  const affectedIndustries = [...new Set(darkWebArticles.flatMap((a) => a.industries))];
  const recentBreaches = darkWebArticles.filter((a) => a.category === "data-breach").slice(0, 5);
  const recentRansomLeaks = darkWebArticles.filter((a) => a.category === "ransomware").slice(0, 5);

  const activeFilterCount = severityFilters.length;

  function toggleSeverity(level: ThreatLevel) {
    setSeverityFilters((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }

  function clearFilters() {
    setSeverityFilters([]);
    setSearch("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-threat-critical/10">
          <Skull className="h-5 w-5 text-threat-critical" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dark Web Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Ransomware leak sites, data breaches, stolen credentials, and underground activity
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="mb-6 border-muted bg-muted/30">
        <CardContent className="p-3 flex items-start gap-2">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All intelligence is sourced from legitimate, public threat research feeds. No direct dark web access is performed. Data includes ransomware leak site monitoring, breach notifications, and underground threat intelligence from verified researchers.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card className="border-threat-critical/20 bg-threat-critical/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{darkWebArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{breachCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Data Breaches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{ransomwareLeaks}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ransom Leaks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{actorsInvolved.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Threat Actors</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search breaches, actors, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
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
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Severity</h4>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map((level) => (
                <button key={level} onClick={() => toggleSeverity(level)}
                  className={cn("transition-opacity", severityFilters.length > 0 && !severityFilters.includes(level) && "opacity-30")}>
                  <ThreatBadge level={level} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {loading ? "Loading..." : `${filtered.length} dark web report${filtered.length !== 1 ? "s" : ""}`}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold">No dark web reports found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeFilterCount > 0 ? "Try removing some filters" : "Dark web intelligence will appear as new data is ingested"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered[0] && <ArticleCard article={filtered[0]} variant="featured" />}
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.slice(1).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Recent Breaches */}
          {recentBreaches.length > 0 && (
            <Card className="border-threat-high/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-high">
                    Recent Breaches
                  </h3>
                </div>
                <div className="space-y-1">
                  {recentBreaches.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ransomware Leak Activity */}
          {recentRansomLeaks.length > 0 && (
            <Card className="border-threat-critical/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-threat-critical" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    Ransomware Leak Sites
                  </h3>
                </div>
                <div className="space-y-1">
                  {recentRansomLeaks.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actors */}
          {actorsInvolved.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Linked Actors ({actorsInvolved.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {actorsInvolved.slice(0, 15).map((actor) => (
                    <Badge key={actor} variant="outline" className="text-xs font-semibold">{actor}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Industries Affected */}
          {affectedIndustries.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Industries Affected
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {affectedIndustries.map((ind) => (
                    <Badge key={ind} variant="outline" className="text-xs capitalize">{ind}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
