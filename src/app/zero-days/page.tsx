export const revalidate = 60;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { ThreatBadge } from "@/components/threat-badge";
import { fetchArticles } from "@/lib/queries";
import {
  Bug,
  AlertTriangle,
  Shield,
  Clock,
  Crosshair,
  Target,
} from "lucide-react";

export const metadata = {
  title: "Zero-Day Tracker",
  description:
    "Track actively exploited zero-day vulnerabilities across all vendors and products.",
};

export default async function ZeroDaysPage() {
  const allArticles = await fetchArticles();

  // Zero-days: category is zero-day, or tags include zero-day, or title mentions it
  const zeroDays = allArticles.filter(
    (a) =>
      a.category === "zero-day" ||
      a.tags.some((t) => t.includes("zero-day") || t.includes("0-day")) ||
      a.title.toLowerCase().includes("zero-day") ||
      a.title.toLowerCase().includes("0-day")
  );

  // Actively exploited: any article mentioning active exploitation
  const activelyExploited = allArticles.filter(
    (a) =>
      a.exploitedAt ||
      a.tags.some((t) =>
        t.includes("active-exploitation") || t.includes("mass-exploitation")
      ) ||
      a.summary.toLowerCase().includes("actively exploited") ||
      a.summary.toLowerCase().includes("exploitation in the wild")
  );

  // Deduplicate (some overlap between the two)
  const activeExploitedIds = new Set(activelyExploited.map((a) => a.id));
  const zeroDayOnly = zeroDays.filter((a) => !activeExploitedIds.has(a.id));
  const combinedIds = new Set([...zeroDays.map((a) => a.id), ...activelyExploited.map((a) => a.id)]);
  const allRelevant = allArticles.filter((a) => combinedIds.has(a.id));

  const allCves = [...new Set(allRelevant.flatMap((a) => a.cves))];
  const allProducts = [...new Set(allRelevant.flatMap((a) => a.affectedProducts))];
  const criticalCount = allRelevant.filter((a) => a.threatLevel === "critical").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Bug className="h-6 w-6 text-threat-critical" />
        <h1 className="text-2xl font-bold tracking-tight">
          Zero-Day Tracker
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Actively exploited zero-day vulnerabilities and in-the-wild exploitation
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card className="border-threat-critical/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {allRelevant.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Active Threats
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-high">
              {zeroDays.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Zero-Days
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {allCves.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              CVEs
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {criticalCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Critical Severity
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Actively Exploited - Top Priority */}
          {activelyExploited.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical animate-threat-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
                  Actively Exploited ({activelyExploited.length})
                </h2>
              </div>
              <div className="space-y-3">
                {activelyExploited.slice(0, 3).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
                {activelyExploited.slice(3).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          {/* Zero-Day Only (not also in actively exploited) */}
          {zeroDayOnly.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="h-4 w-4 text-threat-high" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Zero-Day Vulnerabilities
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {zeroDayOnly.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Affected Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Affected Products
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allProducts.slice(0, 20).map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CVEs */}
          {allCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crosshair className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Zero-Day CVEs ({allCves.length})
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {allCves.slice(0, 12).map((cve) => (
                    <a
                      key={cve}
                      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-threat-critical" />
                      {cve}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                {allRelevant.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-critical shrink-0" />
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
