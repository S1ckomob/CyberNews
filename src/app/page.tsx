import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { StatsBar } from "@/components/stats-bar";
import { fetchArticles } from "@/lib/queries";
import {
  ArrowRight,
  CheckCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";

export default async function HomePage() {
  const articles = await fetchArticles();
  const criticalArticles = articles.filter((a) => a.threatLevel === "critical");
  const featured = criticalArticles[0];
  const trendingTags = [
    "zero-day", "ransomware", "critical-infrastructure", "supply-chain",
    "state-sponsored", "ai-threats", "healthcare", "cloud",
  ];

  return (
    <div className="flex flex-col">
      {/* Compact Hero + Stats inline */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-0 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Cyber Threat Intelligence
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time threat data. Verified sources. Actionable intelligence.
              </p>
            </div>
            <div className="flex gap-2 pb-1">
              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5 text-xs">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/cve">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  CVE Search
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Trust bar */}
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground">
            <span className="uppercase tracking-wider font-medium">Verified by</span>
            {["CISA", "Microsoft", "Mandiant", "CrowdStrike", "FBI", "NSA"].map(
              (name) => (
                <span key={name} className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsBar />

      {/* Featured + Latest side by side */}
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Featured */}
            {featured && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-threat-critical" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    Featured Critical Threat
                  </h2>
                </div>
                <ArticleCard article={featured} variant="featured" />
              </div>
            )}

            {/* Latest grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Latest Intelligence
                </h2>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all {articles.length}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {articles.slice(1, 9).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* More articles */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
                More Reports
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {articles.slice(9, 18).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Critical alerts */}
            <Card className="border-threat-critical/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-threat-critical" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    Critical Alerts
                  </h3>
                </div>
                <div className="space-y-1">
                  {criticalArticles.slice(0, 6).map((article) => (
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
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {trendingTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors font-mono text-[10px]"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <Separator className="mb-3" />
                <div className="space-y-1">
                  {articles.slice(0, 8).map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="compact"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Daily Briefing
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Critical threats and verified CVEs delivered daily.
                  Trusted by 15,000+ security professionals.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="security@company.com"
                    className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button size="sm" className="text-xs">Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
