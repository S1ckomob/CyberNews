"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Lock,
  Monitor,
  Zap,
  Globe,
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
  { value: "mobile", label: "Mobile", keywords: ["ios","android","mobile","iphone","ipad","samsung","pixel","spyware","pegasus","predator","zimperium","lookout","app store","google play"] },
  { value: "ics", label: "ICS / OT / SCADA", keywords: ["scada","ics","plc","ot network","industrial","siemens","schneider","hmi","dcs","rtu","dragos","claroty","critical infrastructure"] },
  { value: "database", label: "Database", keywords: ["sql","mysql","postgres","oracle","mongodb","redis","database","elasticsearch"] },
  { value: "healthcare", label: "Healthcare", keywords: ["healthcare","hipaa","medical device","hospital","health it","patient data","ehr","phi","hhs","medical","telehealth","dicom"] },
  { value: "finance", label: "Financial", keywords: ["banking","financial","swift","fintech","payment","credit card","fraud","bank","atm","trading","cryptocurrency","defi","wallet"] },
  { value: "ai", label: "AI / ML Security", keywords: ["ai security","llm","prompt injection","model poisoning","machine learning","artificial intelligence","chatgpt","copilot","generative ai","ai model","atlas","adversarial"] },
  { value: "darkweb", label: "Dark Web", keywords: ["dark web","darknet","leak site","underground","tor","onion","stolen data","credentials leaked","dark forum","initial access broker","pwned","data breach","ransom leak","ransomwatch","darkfeed"] },
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

const PRESETS = [
  { id: "all", label: "All Intel", icon: BarChart3, category: undefined as Category | undefined, appType: undefined as string | undefined },
  { id: "zero-day", label: "Zero-Days", icon: Bug, category: "zero-day" as Category, appType: undefined as string | undefined },
  { id: "ransomware", label: "Ransomware", icon: Lock, category: "ransomware" as Category, appType: undefined as string | undefined },
  { id: "firewall", label: "Firewalls", icon: Shield, category: undefined as Category | undefined, appType: "firewall" },
  { id: "microsoft", label: "Microsoft", icon: Monitor, category: undefined as Category | undefined, appType: "endpoint" },
  { id: "supply-chain", label: "Supply Chain", icon: Zap, category: "supply-chain" as Category, appType: undefined as string | undefined },
  { id: "darkweb", label: "Dark Web", icon: Globe, category: undefined as Category | undefined, appType: "darkweb" },
] as const;

export default function DashboardPage() {
  return (
    <Suspense>
      <IntelligenceFeed />
    </Suspense>
  );
}

function IntelligenceFeed() {
  const searchParams = useSearchParams();
  const presetParam = searchParams.get("view");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [threatFilters, setThreatFilters] = useState<ThreatLevel[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<Category[]>([]);
  const [industryFilters, setIndustryFilters] = useState<Industry[]>([]);
  const [appTypeFilters, setAppTypeFilters] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string>(presetParam || "all");
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Apply preset from URL on mount
  useEffect(() => {
    if (presetParam) {
      applyPreset(presetParam);
    }
  }, [presetParam]);

  function applyPreset(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);
    setCategoryFilters(preset.category ? [preset.category] : []);
    setAppTypeFilters(preset.appType ? [preset.appType] : []);
    setThreatFilters([]);
    setIndustryFilters([]);
    setSearch("");

    // Update URL without reload
    const url = presetId === "all" ? "/intelligence" : `/intelligence?view=${presetId}`;
    window.history.replaceState({}, "", url);
  }

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

    // Poll for new data every 60 seconds
    const interval = setInterval(load, 60000);

    // Also try realtime if available
    if (!supabase) return () => clearInterval(interval);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("articles-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => load())
        .subscribe();
    } catch {
      // WebSocket may not be available — polling handles it
    }
    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
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
    setActivePreset("all");
    window.history.replaceState({}, "", "/intelligence");
  }

  // Computed stats
  const now = new Date();
  const last24h = articles.filter((a) => now.getTime() - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000);
  const last3d = articles.filter((a) => now.getTime() - new Date(a.publishedAt).getTime() < 3 * 24 * 60 * 60 * 1000);
  const criticalCount = articles.filter((a) => a.threatLevel === "critical").length;
  const highCount = articles.filter((a) => a.threatLevel === "high").length;
  const zeroDayCount = articles.filter((a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day"))).length;
  const allCves = new Set(articles.flatMap((a) => a.cves));
  const newCves24h = [...new Set(last24h.flatMap((a) => a.cves))];
  const allSources = new Set(articles.map((a) => a.source));
  const activeActors = [...new Set(last3d.flatMap((a) => a.threatActors).filter(Boolean))];
  const ransomwareCount = last3d.filter((a) => a.category === "ransomware" || a.tags.some((t) => t.includes("ransomware"))).length;
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

      {/* Category Breakdown — clickable filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Filter by Category
            </h3>
          </div>
          <div className="space-y-1">
            {categoryCounts.slice(0, 8).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => toggleFilter(categoryFilters, cat as Category, setCategoryFilters)}
                className={cn(
                  "flex items-center justify-between w-full text-xs rounded px-2 py-1.5 transition-colors",
                  categoryFilters.includes(cat as Category) ? "bg-primary/10 text-foreground" : "hover:bg-accent text-muted-foreground"
                )}
              >
                <span className="capitalize">{cat.replace("-", " ")}</span>
                <span className="font-mono font-medium w-6 text-right">{count}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Threat Actors */}
      {activeActors.length > 0 && (
        <Card className="border-threat-high/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-threat-high" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Active Actors (3d)
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeActors.slice(0, 15).map((actor) => (
                <Badge key={actor} variant="outline" className="text-xs font-semibold">{actor}</Badge>
              ))}
              {activeActors.length > 15 && (
                <Badge variant="secondary" className="text-[10px]">+{activeActors.length - 15} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New CVEs (24h) */}
      {newCves24h.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                New CVEs (24h) — {newCves24h.length}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {newCves24h.slice(0, 10).map((cve) => (
                <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noopener noreferrer">
                  <Badge variant="secondary" className="font-mono text-[10px] hover:bg-accent cursor-pointer">{cve}</Badge>
                </a>
              ))}
              {newCves24h.length > 10 && (
                <Badge variant="secondary" className="text-[10px]">+{newCves24h.length - 10} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Search Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${articles.length} reports from ${allSources.size} sources`} — search, filter, and drill down
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

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              <Icon className="h-3 w-3" />
              {preset.label}
            </button>
          );
        })}
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
            <SheetContent side="right" className="w-[85vw] sm:w-80 overflow-y-auto">
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
