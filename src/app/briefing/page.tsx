export const dynamic = "force-dynamic";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThreatBadge } from "@/components/threat-badge";
import { ArticleCard } from "@/components/article-card";
import { fetchArticles } from "@/lib/queries";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Shield,
  Clock,
  Bug,
  Lock,
  Target,
} from "lucide-react";

export const metadata = {
  title: "Daily Threat Briefing",
  description: "AI-generated executive summary of today's cybersecurity threat landscape.",
};

export default async function BriefingPage() {
  const articles = await fetchArticles();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

  const last24h = articles.filter((a) => new Date(a.publishedAt) >= yesterday);
  const last3d = articles.filter((a) => new Date(a.publishedAt) >= threeDaysAgo);

  const critical24h = last24h.filter((a) => a.threatLevel === "critical");
  const high24h = last24h.filter((a) => a.threatLevel === "high");
  const zeroDays = last3d.filter(
    (a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day")) || a.exploitedAt
  );
  const ransomware = last3d.filter(
    (a) => a.category === "ransomware" || a.tags.some((t) => t.includes("ransomware"))
  );
  const newCves = [...new Set(last24h.flatMap((a) => a.cves))];
  const activeActors = [...new Set(last3d.flatMap((a) => a.threatActors).filter(Boolean))];
  const topSources = [...new Set(last24h.map((a) => a.source))];

  // Category breakdown
  const categories: Record<string, number> = {};
  last24h.forEach((a) => { categories[a.category] = (categories[a.category] || 0) + 1; });
  const topCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  // Industry breakdown
  const industries: Record<string, number> = {};
  last3d.forEach((a) => a.industries.forEach((ind) => { industries[ind] = (industries[ind] || 0) + 1; }));
  const topIndustries = Object.entries(industries).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Intelligence Briefing
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Daily Threat Briefing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Generated from {last24h.length} reports across {topSources.length} sources
        </div>
      </div>

      {/* Situation Overview */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Situation Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-threat-critical">{critical24h.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-threat-high">{high24h.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">High (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-primary">{zeroDays.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Zero-Days (3d)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-foreground">{last24h.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total (24h)</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {critical24h.length > 0
              ? `${critical24h.length} critical threat${critical24h.length > 1 ? "s" : ""} detected in the last 24 hours requiring immediate attention. `
              : "No critical threats in the last 24 hours. "}
            {zeroDays.length > 0
              ? `${zeroDays.length} actively exploited zero-day${zeroDays.length > 1 ? "s" : ""} tracked over the past 3 days. `
              : ""}
            {ransomware.length > 0
              ? `${ransomware.length} ransomware-related report${ransomware.length > 1 ? "s" : ""} in the last 72 hours. `
              : ""}
            {activeActors.length > 0
              ? `${activeActors.length} named threat actor${activeActors.length > 1 ? "s" : ""} active.`
              : ""}
          </p>
        </CardContent>
      </Card>

      {/* Critical Threats */}
      {critical24h.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-threat-critical" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
              Critical Threats — Immediate Action Required
            </h2>
          </div>
          <div className="space-y-3">
            {critical24h.map((a) => (
              <ArticleCard key={a.id} article={a} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* Zero-Days */}
      {zeroDays.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bug className="h-4 w-4 text-threat-high" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Active Zero-Days ({zeroDays.length})
            </h2>
          </div>
          <div className="space-y-2">
            {zeroDays.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {/* Ransomware */}
      {ransomware.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-threat-high" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Ransomware Activity ({ransomware.length})
            </h2>
          </div>
          <div className="space-y-2">
            {ransomware.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </section>
      )}

      <Separator className="my-6" />

      {/* Threat Landscape */}
      <div className="grid gap-6 sm:grid-cols-2 mb-6">
        {/* Categories */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Threat Categories (24h)</h3>
            </div>
            <div className="space-y-2">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{cat.replace("-", " ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-primary/20 w-20">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (count / last24h.length) * 100)}%` }} />
                    </div>
                    <span className="font-mono font-medium w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industries */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Industries Impacted (3d)</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topIndustries.map(([ind, count]) => (
                <Badge key={ind} variant="outline" className="text-xs capitalize gap-1">
                  {ind}
                  <span className="font-mono text-primary">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Actors */}
      {activeActors.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-threat-high" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Active Threat Actors (3 days)
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeActors.map((actor) => (
                <Badge key={actor} variant="outline" className="text-xs font-semibold">
                  {actor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New CVEs */}
      {newCves.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
              New CVEs (24h) — {newCves.length}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {newCves.map((cve) => (
                <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noopener noreferrer">
                  <Badge variant="secondary" className="font-mono text-xs hover:bg-accent cursor-pointer">
                    {cve}
                  </Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reports */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
          All Reports — Last 24 Hours ({last24h.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {last24h.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
        {last24h.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No articles published in the last 24 hours. Check back soon or view the full dashboard.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
