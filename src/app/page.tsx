export const revalidate = 60;

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { SubscribeForm } from "@/components/subscribe-form";
import { ThreatLevelIndicator } from "@/components/threat-level-indicator";
import { FreshnessBadge } from "@/components/freshness-badge";
import { SeverityChart } from "@/components/severity-chart";
import { ThreatMap } from "@/components/threat-map";
import { ActivityFeed } from "@/components/activity-feed";
import { StatsBar } from "@/components/stats-bar";
import { fetchArticlesLimited } from "@/lib/queries";
import {
  ArrowRight,
  AlertTriangle,
  Bug,
  Zap,
  TrendingUp,
  Clock,
  Bell,
} from "lucide-react";

export default async function HomePage() {
  const articles = await fetchArticlesLimited(40);
  const criticalArticles = articles.filter((a) => a.threatLevel === "critical");
  const zeroDays = articles.filter(
    (a) =>
      a.category === "zero-day" ||
      a.tags.some((t) => t.includes("zero-day") || t.includes("0-day")) ||
      a.exploitedAt
  );

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Security Intel Hub",
    url: siteUrl,
    description: "The institutional standard for cybersecurity intelligence.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/cve?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Security Intel Hub",
    url: siteUrl,
    description: "Institutional cybersecurity threat intelligence platform.",
    sameAs: [],
  };

  return (
    <div className="flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      {/* Global Threat Level */}
      <ThreatLevelIndicator articles={articles} />

      {/* Stats */}
      <StatsBar />

      {/* Zero-Day Banner */}
      {zeroDays.length > 0 && (
        <div className="border-b border-threat-critical/20 bg-threat-critical/5">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-3.5 w-3.5 text-threat-critical animate-threat-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-threat-critical">
                  {zeroDays.length} Active Zero-Day{zeroDays.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Link href="/zero-days">
                <Button variant="ghost" size="sm" className="gap-1 text-[10px] text-threat-critical hover:text-threat-critical h-8">
                  View <ArrowRight className="h-2.5 w-2.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Command Center Layout */}
      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr_300px]">
          {/* Left Column — Severity + Critical Alerts */}
          <div className="space-y-4 hidden lg:block">
            <Card>
              <CardContent className="p-4">
                <SeverityChart articles={articles} />
              </CardContent>
            </Card>

            <Link href="/map">
              <Card className="group hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Threat Map</span>
                    <span className="text-[9px] text-muted-foreground group-hover:text-primary transition-colors">View →</span>
                  </div>
                  <ThreatMap articles={articles} compact />
                </CardContent>
              </Card>
            </Link>

            <Card className="border-threat-critical/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-threat-critical" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-threat-critical">
                    Critical
                  </h3>
                </div>
                <div className="space-y-1">
                  {criticalArticles.slice(0, 6).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column — Latest Intel Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Latest Intelligence</h2>
              <FreshnessBadge />
              </div>
              <Link href="/intelligence">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                  All {articles.length}+ <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Featured top article */}
            {articles[0] && <ArticleCard article={articles[0]} variant="featured" />}

            {/* Dense grid */}
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              {articles.slice(1, 13).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>

          {/* Right Column — Live Feed + Trending + Newsletter */}
          <div className="space-y-4 min-w-0 overflow-hidden">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Live Activity</h3>
                </div>
                <ActivityFeed />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Trending</h3>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["zero-day", "ransomware", "critical-infrastructure", "supply-chain", "state-sponsored", "ai-threats", "cloud"].map((tag) => (
                    <Badge key={tag} variant="outline" className="font-mono text-[9px] cursor-pointer hover:bg-accent">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
              <CardContent className="p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Threat Alerts</h3>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
                  Real-time alerts for the threats that matter to you. Choose your severity levels and threat categories.
                </p>
                <div className="min-w-0">
                  <SubscribeForm />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
