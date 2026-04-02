export const revalidate = 60;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleCard } from "@/components/article-card";
import { ThreatMap } from "@/components/threat-map";
import { fetchArticlesLimited } from "@/lib/queries";
import { Globe, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Threat Map",
  description: "Live visualization of cybersecurity threats by geographic region.",
};

export default async function MapPage() {
  const articles = await fetchArticlesLimited(100);

  // Region stats
  const regionCounts: Record<string, { total: number; critical: number }> = {};
  for (const a of articles) {
    const region = a.region || "Global";
    if (!regionCounts[region]) regionCounts[region] = { total: 0, critical: 0 };
    regionCounts[region].total++;
    if (a.threatLevel === "critical") regionCounts[region].critical++;
  }

  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1].total - a[1].total);

  const recentCritical = articles
    .filter((a) => a.threatLevel === "critical")
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Globe className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Global Threat Map</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Geographic distribution of cybersecurity threats. Dot size indicates volume, color indicates severity.
      </p>

      {/* Full Map */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <ThreatMap articles={articles} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Region Breakdown */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Threats by Region
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {sortedRegions.map(([region, counts]) => (
              <Card key={region}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{region}</h3>
                    <p className="text-xs text-muted-foreground">{counts.total} reports</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {counts.critical > 0 && (
                      <Badge variant="outline" className="text-[10px] text-threat-critical border-threat-critical/30">
                        {counts.critical} critical
                      </Badge>
                    )}
                    <span className="font-mono text-lg font-bold text-primary">{counts.total}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar — Recent Critical */}
        <aside className="space-y-4">
          <Card className="border-threat-critical/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                  Critical Threats
                </h3>
              </div>
              <div className="space-y-1">
                {recentCritical.map((a) => (
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
