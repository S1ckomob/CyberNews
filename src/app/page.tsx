import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { StatsBar } from "@/components/stats-bar";
import { articles } from "@/lib/data";
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Globe,
  Zap,
  Lock,
  TrendingUp,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";

export default function HomePage() {
  const criticalArticles = articles.filter((a) => a.threatLevel === "critical");
  const featured = criticalArticles[0];
  const trendingTags = ["zero-day", "ransomware", "critical-infrastructure", "supply-chain", "state-sponsored"];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Shield className="h-4 w-4" />
              <span className="font-mono text-xs font-semibold uppercase tracking-widest">
                Cybersecurity Intelligence
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The Institutional Standard for{" "}
              <span className="text-primary">Cyber Threat Intelligence</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Real-time threat data. Verified sources. Actionable intelligence.
              Trusted by security teams, CISOs, and government agencies worldwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Open Dashboard
                </Button>
              </Link>
              <Link href="/cve">
                <Button variant="outline" size="lg" className="gap-2">
                  Search CVEs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsBar />

      {/* Trust Badges */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Sources verified by
            </span>
            {["CISA", "Microsoft", "Mandiant", "CrowdStrike", "FBI"].map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{name}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Featured Critical Threat */}
      {featured && (
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-threat-critical" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
              Featured Critical Threat
            </h2>
          </div>
          <ArticleCard article={featured} variant="featured" />
        </section>
      )}

      {/* Latest Intelligence */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Latest Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              Real-time threat data from verified sources
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(1, 7).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Trending + Newsletter */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Trending */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Trending Topics
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors font-mono text-xs"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="space-y-1">
                {articles.slice(0, 5).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                  />
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div>
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                      Daily Briefing
                    </h3>
                  </div>
                  <h4 className="text-xl font-semibold tracking-tight">
                    Get intelligence delivered to your inbox
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Daily briefings curated by our intelligence team.
                    Critical threats, verified CVEs, and actionable
                    recommendations.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="email"
                      placeholder="security@company.com"
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button>Subscribe</Button>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    No spam. Unsubscribe anytime. Trusted by 15,000+ security professionals.
                  </p>
                </CardContent>
              </Card>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <Globe className="h-5 w-5 text-primary mb-2" />
                    <h4 className="text-sm font-semibold">Global Coverage</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Threats tracked across every region and industry
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Lock className="h-5 w-5 text-primary mb-2" />
                    <h4 className="text-sm font-semibold">Verified Sources</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Every report attributed and verified
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
