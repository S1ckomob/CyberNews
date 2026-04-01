"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { ThreatBadge } from "@/components/threat-badge";
import { articles } from "@/lib/data";
import type { ThreatLevel, Category, Industry } from "@/lib/types";
import {
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");
  const [threatFilters, setThreatFilters] = useState<ThreatLevel[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<Category[]>([]);
  const [industryFilters, setIndustryFilters] = useState<Industry[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredArticles = useMemo(() => {
    let result = articles;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.cves.some((c) => c.toLowerCase().includes(q)) ||
          a.affectedProducts.some((p) => p.toLowerCase().includes(q)) ||
          a.threatActors.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (threatFilters.length > 0) {
      result = result.filter((a) => threatFilters.includes(a.threatLevel));
    }
    if (categoryFilters.length > 0) {
      result = result.filter((a) => categoryFilters.includes(a.category));
    }
    if (industryFilters.length > 0) {
      result = result.filter((a) =>
        a.industries.some((i) => industryFilters.includes(i))
      );
    }

    return result;
  }, [search, threatFilters, categoryFilters, industryFilters]);

  const activeFilterCount =
    threatFilters.length + categoryFilters.length + industryFilters.length;

  function toggleFilter<T>(arr: T[], value: T, setter: (v: T[]) => void) {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  function clearAllFilters() {
    setThreatFilters([]);
    setCategoryFilters([]);
    setIndustryFilters([]);
    setSearch("");
  }

  const trendingArticles = articles.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligence Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time threat intelligence feed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-threat-critical/10 px-2.5 py-1 text-xs font-medium text-threat-critical">
            <span className="h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threats, CVEs, products, actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            {/* Threat Level */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Threat Level
              </h3>
              <div className="flex flex-wrap gap-2">
                {THREAT_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      toggleFilter(threatFilters, level, setThreatFilters)
                    }
                    className={cn(
                      "transition-opacity",
                      threatFilters.length > 0 &&
                        !threatFilters.includes(level) &&
                        "opacity-40"
                    )}
                  >
                    <ThreatBadge level={level} />
                  </button>
                ))}
              </div>
            </div>
            {/* Category */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Category
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant="outline"
                    className={cn(
                      "cursor-pointer text-xs transition-all",
                      categoryFilters.includes(cat.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    )}
                    onClick={() =>
                      toggleFilter(categoryFilters, cat.value, setCategoryFilters)
                    }
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Industry */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Industry
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRIES.map((ind) => (
                  <Badge
                    key={ind.value}
                    variant="outline"
                    className={cn(
                      "cursor-pointer text-xs transition-all",
                      industryFilters.includes(ind.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    )}
                    onClick={() =>
                      toggleFilter(industryFilters, ind.value, setIndustryFilters)
                    }
                  >
                    {ind.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {filteredArticles.length} {filteredArticles.length === 1 ? "result" : "results"}
            </h2>
          </div>
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold">No results found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
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
                {articles
                  .filter((a) => a.threatLevel === "critical")
                  .slice(0, 4)
                  .map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="compact"
                    />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Trending
                </h3>
              </div>
              <div className="space-y-1">
                {trendingArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Recent Updates
                </h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                {articles.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
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
