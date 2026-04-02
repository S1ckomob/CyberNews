"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import type { ArticleRow, ThreatActorRow } from "@/lib/supabase";
import type { Article, ThreatLevel, ThreatActor } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Lock,
  AlertTriangle,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Activity,
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

function rowToThreatActor(row: ThreatActorRow): ThreatActor {
  return {
    id: row.id, name: row.name, aliases: row.aliases, origin: row.origin,
    description: row.description, targetIndustries: row.target_industries as ThreatActor["targetIndustries"],
    firstSeen: row.first_seen, lastActive: row.last_active, ttps: row.ttps,
  };
}

const RANSOMWARE_GROUPS = [
  "LockBit", "Cl0p", "Black Basta", "ALPHV/BlackCat", "Rhysida",
  "Play Ransomware", "Medusa", "RansomHub", "Akira", "Cicada3301",
];

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

export default function RansomwarePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<ThreatLevel[]>([]);
  const [actorFilter, setActorFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("articles").select("*").order("published_at", { ascending: false }),
      supabase.from("threat_actors").select("*").order("last_active", { ascending: false }),
    ]).then(([artRes, actRes]) => {
      if (artRes.data) setArticles(artRes.data.map(rowToArticle));
      if (actRes.data) setActors(actRes.data.map(rowToThreatActor));
      setLoading(false);
    });
  }, []);

  const ransomwareArticles = useMemo(() => articles.filter(
    (a) =>
      a.category === "ransomware" ||
      a.tags.some((t) => t.includes("ransomware")) ||
      a.title.toLowerCase().includes("ransomware") ||
      a.threatActors.some((ta) => RANSOMWARE_GROUPS.some((rg) => ta.includes(rg)))
  ), [articles]);

  const ransomwareActors = useMemo(() => actors.filter(
    (a) =>
      a.ttps.some((t) => t.toLowerCase().includes("ransomware") || t.toLowerCase().includes("extortion")) ||
      RANSOMWARE_GROUPS.some((rg) => a.name.includes(rg) || a.aliases.some((al) => al.includes(rg)))
  ), [actors]);

  // Available actor names for filter
  const actorNames = useMemo(() => ransomwareActors.map((a) => a.name), [ransomwareActors]);

  // Filter toggles
  const toggleSeverity = (level: ThreatLevel) => {
    setSeverityFilters((prev) =>
      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
    );
  };
  const toggleActor = (name: string) => {
    setActorFilter((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };
  const activeFilterCount = severityFilters.length + actorFilter.length;
  const clearFilters = () => { setSeverityFilters([]); setActorFilter([]); setSearch(""); };

  // Apply filters
  const filteredArticles = useMemo(() => {
    let list = ransomwareArticles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.threatActors.some((t) => t.toLowerCase().includes(q)) ||
        a.cves.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (severityFilters.length > 0) {
      list = list.filter((a) => severityFilters.includes(a.threatLevel));
    }
    if (actorFilter.length > 0) {
      list = list.filter((a) =>
        a.threatActors.some((ta) => actorFilter.some((af) => ta.includes(af)))
      );
    }
    return list;
  }, [ransomwareArticles, search, severityFilters, actorFilter]);

  // Group articles per actor (using filtered articles)
  const actorActivity = useMemo(() => ransomwareActors.map((actor) => {
    const related = filteredArticles.filter((a) =>
      a.threatActors.some((t) => t === actor.name || actor.aliases.includes(t))
    );
    return { actor, articles: related };
  }).sort((a, b) => b.articles.length - a.articles.length), [ransomwareActors, filteredArticles]);

  const criticalCount = useMemo(() => filteredArticles.filter((a) => a.threatLevel === "critical").length, [filteredArticles]);
  const targetedIndustries = useMemo(() => [...new Set(filteredArticles.flatMap((a) => a.industries))], [filteredArticles]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="h-6 w-6 text-threat-critical" />
          <h1 className="text-2xl font-bold tracking-tight">Ransomware Tracker</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Lock className="h-6 w-6 text-threat-critical" />
        <h1 className="text-2xl font-bold tracking-tight">Ransomware Tracker</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Live tracking of active ransomware groups, campaigns, and trends
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card className="border-threat-critical/20 bg-threat-critical/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{filteredArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{ransomwareActors.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Groups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{criticalCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{targetedIndustries.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Industries Hit</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search ransomware reports, actors, CVEs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
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
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Actor Groups</h4>
              <div className="flex flex-wrap gap-1.5">
                {actorNames.map((name) => (
                  <Badge
                    key={name}
                    variant={actorFilter.includes(name) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleActor(name)}
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Active Groups */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-threat-critical" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Active Ransomware Groups
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {actorActivity.map(({ actor, articles: related }) => (
                <Link key={actor.id} href={`/threat-actors/${actor.id}`}>
                  <Card className="group h-full transition-all hover:border-threat-critical/30 hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {actor.name}
                          </h3>
                          {actor.aliases.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {actor.aliases.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-threat-critical" />
                          <span className="text-xs font-mono font-bold text-threat-critical">
                            {related.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {actor.ttps.slice(0, 3).map((ttp) => (
                          <Badge key={ttp} variant="secondary" className="text-[10px]">
                            {ttp}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Origin: {actor.origin}</span>
                        <span>&middot;</span>
                        <span>Last active: {actor.lastActive}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recent Ransomware Activity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-threat-critical" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Recent Ransomware Activity ({filteredArticles.length})
              </h2>
            </div>
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No ransomware articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Most Active */}
          <Card className="border-threat-critical/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                  Most Active
                </h3>
              </div>
              <div className="space-y-2">
                {actorActivity.slice(0, 8).map(({ actor, articles: related }, i) => (
                  <Link
                    key={actor.id}
                    href={`/threat-actors/${actor.id}`}
                    className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-medium">{actor.name}</span>
                    </div>
                    <span className="font-mono font-bold text-threat-critical">{related.length}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Targeted Industries */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Targeted Industries
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetedIndustries.map((ind) => {
                  const count = filteredArticles.filter((a) => a.industries.includes(ind as typeof a.industries[number])).length;
                  return (
                    <Link key={ind} href={`/industry/${ind}`}>
                      <Badge variant="outline" className="text-xs capitalize gap-1 cursor-pointer hover:bg-accent">
                        {ind}
                        <span className="font-mono text-primary">{count}</span>
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Critical */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Critical Ransomware
                </h3>
              </div>
              <div className="space-y-1">
                {filteredArticles
                  .filter((a) => a.threatLevel === "critical")
                  .slice(0, 5)
                  .map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
