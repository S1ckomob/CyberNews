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
import type { ArticleRow } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Shield,
  Monitor,
  AlertTriangle,
  Tag,
  Calendar,
  Bug,
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

const MICROSOFT_KEYWORDS = [
  "windows", "microsoft", "ntlm", "active directory", "hyper-v",
  "exchange", "outlook", "office", "azure ad", "entra", "patch tuesday",
  "msrc", "defender", ".net", "iis", "sharepoint", "teams",
];

const PRODUCT_GROUPS = [
  "Windows", "Exchange", "Outlook", "Office", "Azure AD / Entra",
  "Active Directory", "Hyper-V", "Defender", "SharePoint", "Teams", "IIS", ".NET",
];

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

export default function WindowsPage() {
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

  const microsoftArticles = useMemo(() => articles.filter((a) => {
    const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.tags.join(" ")} ${a.cves.join(" ")}`.toLowerCase();
    return MICROSOFT_KEYWORDS.some((kw) => text.includes(kw));
  }), [articles]);

  // Filter toggles
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
  const filteredArticles = useMemo(() => {
    let list = microsoftArticles;
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
      list = list.filter((a) => {
        const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.content}`.toLowerCase();
        return productFilter.some((p) => text.includes(p.toLowerCase()));
      });
    }
    return list;
  }, [microsoftArticles, search, severityFilters, productFilter]);

  const criticalMicrosoft = useMemo(() => filteredArticles.filter((a) => a.threatLevel === "critical"), [filteredArticles]);
  const zeroDayMicrosoft = useMemo(() => filteredArticles.filter(
    (a) => a.category === "zero-day" || a.tags.includes("zero-day") || a.tags.includes("patch-tuesday")
  ), [filteredArticles]);
  const allCves = useMemo(() => [...new Set(filteredArticles.flatMap((a) => a.cves))], [filteredArticles]);
  const patchTuesday = useMemo(() => filteredArticles.filter(
    (a) => a.title.toLowerCase().includes("patch tuesday") || a.tags.includes("patch-tuesday")
  ), [filteredArticles]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Microsoft Security Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Monitor className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Microsoft Security Intelligence
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Vulnerabilities, CVEs, Patch Tuesday, and Microsoft product security advisories
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {filteredArticles.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Reports
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {criticalMicrosoft.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Critical
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-high">
              {allCves.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              CVEs Tracked
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-medium">
              {zeroDayMicrosoft.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Zero-Days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search Microsoft reports, CVEs, products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
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
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Microsoft Products</h4>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_GROUPS.map((product) => (
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
        {/* Main */}
        <div className="space-y-6">
          {/* Patch Tuesday */}
          {patchTuesday.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Patch Tuesday
                </h2>
              </div>
              <div className="space-y-3">
                {patchTuesday.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
              </div>
            </div>
          )}

          {/* Zero-Days */}
          {zeroDayMicrosoft.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-4 w-4 text-threat-critical" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
                  Active Zero-Days
                </h2>
              </div>
              <div className="space-y-3">
                {zeroDayMicrosoft.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* All Microsoft articles */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
              All Microsoft Reports ({filteredArticles.length})
            </h2>
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No Microsoft-related articles found.
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
          {/* Microsoft CVEs */}
          {allCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Microsoft CVEs ({allCves.length})
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {allCves.slice(0, 15).map((cve) => (
                    <Link
                      key={cve}
                      href={`/cve/${cve}`}
                      className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-threat-high" />
                      {cve}
                    </Link>
                  ))}
                  {allCves.length > 15 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{allCves.length - 15} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Affected Products
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(
                  filteredArticles.flatMap((a) =>
                    a.affectedProducts.filter((p) =>
                      MICROSOFT_KEYWORDS.some((kw) => p.toLowerCase().includes(kw))
                    )
                  )
                )]
                  .slice(0, 20)
                  .map((product) => (
                    <Badge key={product} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          {criticalMicrosoft.length > 0 && (
            <Card className="border-threat-critical/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-threat-critical" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    Critical Microsoft Threats
                  </h3>
                </div>
                <div className="space-y-1">
                  {criticalMicrosoft.slice(0, 5).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
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
