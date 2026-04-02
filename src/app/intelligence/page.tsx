"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/article-card";
import { ThreatBadge } from "@/components/threat-badge";
import { supabase } from "@/lib/supabase";
import type { Article, ThreatLevel, Category, Industry } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  Bug,
  Shield,
  BarChart3,
  RefreshCw,
  PanelRight,
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

const THREAT_LEVELS: ThreatLevel[] = ["critical", "high", "medium", "low"];
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "vulnerability", label: "Vulnerability" },
  { value: "malware", label: "Malware" },
  { value: "ransomware", label: "Ransomware" },
  { value: "data-breach", label: "Data Breach" },
  { value: "apt", label: "APT" },
  { value: "zero-day", label: "Zero-Day" },
  { value: "supply-chain", label: "Supply Chain" },
  { value: "phishing", label: "Phishing" },
  { value: "ddos", label: "DDoS" },
];
type AppType = typeof APP_TYPES[number]["value"];
const APP_TYPES = [
  { value: "firewall", label: "Firewall / Network Edge", keywords: ["fortinet","fortigate","fortios","fortimanager","palo alto","pan-os","globalprotect","cisco asa","cisco firepower","sonicwall","ivanti","pulse secure","juniper","check point","f5 big-ip","vpn","firewall"] },
  { value: "cloud", label: "Cloud / SaaS", keywords: ["aws","azure","gcp","cloud","kubernetes","docker","container","saas","serverless","lambda","s3","ec2"] },
  { value: "endpoint", label: "Endpoint / OS", keywords: ["windows","linux","macos","kernel","active directory","hyper-v","ntlm","vmware esxi","vcenter","endpoint"] },
  { value: "web", label: "Web Application", keywords: ["wordpress","apache","nginx","iis","web application","sql injection","xss","cms","php","drupal"] },
  { value: "email", label: "Email / Collaboration", keywords: ["exchange","outlook","microsoft 365","teams","gmail","email","o365","sharepoint","slack"] },
  { value: "browser", label: "Browser", keywords: ["chrome","firefox","edge","safari","webkit","chromium","browser","v8"] },
  { value: "devops", label: "DevOps / CI-CD", keywords: ["jenkins","github","gitlab","cicd","ci/cd","npm","pypi","docker","terraform","ansible","supply chain","pipeline"] },
  { value: "mobile", label: "Mobile", keywords: ["ios","android","mobile","iphone","ipad","samsung","pixel"] },
  { value: "ics", label: "ICS / OT / SCADA", keywords: ["scada","ics","plc","ot network","industrial","siemens","schneider","hmi","dcs","rtu"] },
  { value: "database", label: "Database", keywords: ["sql","mysql","postgres","oracle","mongodb","redis","database","elasticsearch"] },
] as const;

function getAppTypes(article: Article): string[] {
  const text = `${article.title} ${article.affectedProducts.join(" ")} ${article.summary} ${article.tags.join(" ")}`.toLowerCase();
  return APP_TYPES
    .filter((t) => t.keywords.some((kw) => text.includes(kw)))
    .map((t) => t.value);
}

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "government", label: "Government" },
  { value: "energy", label: "Energy" },
  { value: "technology", label: "Technology" },
  { value: "defense", label: "Defense" },
  { value: "retail", label: "Retail" },
  { value: "education", label: "Education" },
  { value: "telecommunications", label: "Telecom" },
  { value: "manufacturing", label: "Manufacturing" },
];

export default function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [threatFilters, setThreatFilters] = useState<ThreatLevel[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<Category[]>([]);
  const [industryFilters, setIndustryFilters] = useState<Industry[]>([]);
  const [appTypeFilters, setAppTypeFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (data) setArticles(data.map(rowToArticle));
    setLoading(false);
    setRefreshing(false);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    load();
    if (!supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("articles-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => load())
        .subscribe();
    } catch {
      // WebSocket may not be available in all environments
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) ||
        a.cves.some((c) => c.toLowerCase().includes(q)) ||
        a.affectedProducts.some((p) => p.toLowerCase().includes(q)) ||
        a.threatActors.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (threatFilters.length > 0) result = result.filter((a) => threatFilters.includes(a.threatLevel));
    if (categoryFilters.length > 0) result = result.filter((a) => categoryFilters.includes(a.category));
    if (industryFilters.length > 0) result = result.filter((a) => a.industries.some((i) => industryFilters.includes(i)));
    if (appTypeFilters.length > 0) result = result.filter((a) => {
      const types = getAppTypes(a);
      return appTypeFilters.some((f) => types.includes(f));
    });
    return result;
  }, [articles, search, threatFilters, categoryFilters, industryFilters, appTypeFilters]);

  const activeFilterCount = threatFilters.length + categoryFilters.length + industryFilters.length + appTypeFilters.length;

  function toggleFilter<T>(arr: T[], value: T, setter: (v: T[]) => void) {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  function clearAllFilters() {
    setThreatFilters([]); setCategoryFilters([]); setIndustryFilters([]); setAppTypeFilters([]); setSearch("");
  }

  // Computed stats
  const criticalCount = articles.filter((a) => a.threatLevel === "critical").length;
  const highCount = articles.filter((a) => a.threatLevel === "high").length;
  const zeroDayCount = articles.filter((a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day"))).length;
  const allCves = new Set(articles.flatMap((a) => a.cves));
  const allSources = new Set(articles.map((a) => a.source));
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [articles]);

  const zeroDayArticles = articles.filter((a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day")));
  const criticalArticles = articles.filter((a) => a.threatLevel === "critical");

  const sidebarContent = (
    <>
      {/* Zero-Day Alerts */}
      {zeroDayArticles.length > 0 && (
        <Card className="border-threat-critical/30 bg-threat-critical/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="h-4 w-4 text-threat-critical animate-threat-pulse" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                Active Zero-Days
              </h3>
            </div>
            <div className="space-y-1">
              {zeroDayArticles.slice(0, 5).map((a) => (
                <ArticleCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts */}
      <Card className="border-threat-critical/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-threat-critical" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
              Critical Alerts
            </h3>
          </div>
          <div className="space-y-1">
            {criticalArticles.slice(0, 5).map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              By Category
            </h3>
          </div>
          <div className="space-y-2">
            {categoryCounts.slice(0, 8).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => toggleFilter(categoryFilters, cat as Category, setCategoryFilters)}
                className="flex items-center justify-between w-full text-xs hover:bg-accent rounded px-2 py-1 transition-colors"
              >
                <span className="capitalize text-muted-foreground">{cat.replace("-", " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full bg-primary/20 w-16">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (count / articles.length) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono font-medium text-foreground w-6 text-right">{count}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Trending</h3>
          </div>
          <div className="space-y-1">
            {articles.slice(0, 6).map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Sources</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...allSources].slice(0, 12).map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
            ))}
            {allSources.size > 12 && (
              <Badge variant="secondary" className="text-[10px]">+{allSources.size - 12} more</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligence Feed</h1>
          <p className="text-sm text-muted-foreground">
            All threat intelligence — search, filter, and monitor
            {lastUpdated && (
              <span className="ml-2 text-xs">
                &middot; Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <div className="flex items-center gap-1.5 rounded-full bg-threat-critical/10 px-2.5 py-1 text-xs font-medium text-threat-critical">
            <span className="h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6 mb-6">
        <Card className="border-threat-critical/20 bg-threat-critical/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{criticalCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className="border-threat-high/20 bg-threat-high/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{highCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">High</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{zeroDayCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Zero-Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{allCves.size}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CVEs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-foreground">{articles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-foreground">{allSources.size}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sources</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threats, CVEs, products, actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
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
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Threat Level</h3>
              <div className="flex flex-wrap gap-2">
                {THREAT_LEVELS.map((level) => (
                  <button key={level} onClick={() => toggleFilter(threatFilters, level, setThreatFilters)}
                    className={cn("transition-opacity", threatFilters.length > 0 && !threatFilters.includes(level) && "opacity-40")}>
                    <ThreatBadge level={level} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category</h3>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <Badge key={cat.value} variant="outline"
                    className={cn("cursor-pointer text-xs transition-all", categoryFilters.includes(cat.value) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}
                    onClick={() => toggleFilter(categoryFilters, cat.value, setCategoryFilters)}>
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Industry</h3>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRIES.map((ind) => (
                  <Badge key={ind.value} variant="outline"
                    className={cn("cursor-pointer text-xs transition-all", industryFilters.includes(ind.value) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}
                    onClick={() => toggleFilter(industryFilters, ind.value, setIndustryFilters)}>
                    {ind.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Application Type</h3>
              <div className="flex flex-wrap gap-1.5">
                {APP_TYPES.map((appType) => (
                  <Badge key={appType.value} variant="outline"
                    className={cn("cursor-pointer text-xs transition-all", appTypeFilters.includes(appType.value) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}
                    onClick={() => toggleFilter(appTypeFilters, appType.value, setAppTypeFilters)}>
                    {appType.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Mobile sidebar trigger */}
        <div className="lg:hidden flex justify-end -mt-2 mb-1">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
              <PanelRight className="h-3.5 w-3.5" />
              Insights
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetTitle className="sr-only">Intelligence Insights</SheetTitle>
              <div className="mt-4 space-y-4">
                {sidebarContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {loading ? "Loading..." : `${filteredArticles.length} ${filteredArticles.length === 1 ? "result" : "results"}`}
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold">No results found</h3>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Feature the first critical article */}
              {filteredArticles[0] && (
                <ArticleCard article={filteredArticles[0]} variant="featured" />
              )}
              {/* Grid for the rest */}
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredArticles.slice(1).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — desktop only, mobile uses Sheet above */}
        <aside className="hidden lg:block space-y-4" aria-label="Intelligence insights">
          {sidebarContent}
        </aside>
      </div>
    </div>
  );
}
