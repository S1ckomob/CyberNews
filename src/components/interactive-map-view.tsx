"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThreatBadge } from "@/components/threat-badge";
import { ThreatMap } from "@/components/threat-map";
import { Clock, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface RegionData {
  total: number;
  critical: number;
  high: number;
  articles: Article[];
}

function formatDate(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function InteractiveMapView({ articles }: { articles: Article[] }) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionMap = useMemo(() => {
    const map: Record<string, RegionData> = {};
    for (const a of articles) {
      const region = a.region || "Global";
      if (!map[region]) map[region] = { total: 0, critical: 0, high: 0, articles: [] };
      map[region].total++;
      if (a.threatLevel === "critical") map[region].critical++;
      if (a.threatLevel === "high") map[region].high++;
      map[region].articles.push(a);
    }
    return map;
  }, [articles]);

  const sortedRegions = useMemo(
    () => Object.entries(regionMap).sort((a, b) => b[1].total - a[1].total),
    [regionMap]
  );

  const displayArticles = useMemo(() => {
    if (!selectedRegion) return null;
    return regionMap[selectedRegion]?.articles ?? [];
  }, [selectedRegion, regionMap]);

  const handleRegionClick = useCallback((region: string) => {
    setSelectedRegion((prev) => (prev === region ? null : region));
  }, []);

  return (
    <div className="space-y-6">
      {/* Map */}
      <Card>
        <CardContent className="p-4">
          <ThreatMap articles={articles} />
        </CardContent>
      </Card>

      {/* Selected Region Detail */}
      {selectedRegion && displayArticles && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{selectedRegion}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {displayArticles.length} threat{displayArticles.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {displayArticles.slice(0, 10).map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="flex items-start gap-2.5 rounded-md p-2 -mx-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="shrink-0 mt-0.5">
                    <ThreatBadge level={article.threatLevel} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium leading-tight line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(article.publishedAt)}
                      </span>
                      <span className="font-mono">{article.source}</span>
                      {article.cves.length > 0 && (
                        <span className="font-mono text-threat-high">
                          {article.cves[0]}
                          {article.cves.length > 1 && ` +${article.cves.length - 1}`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {displayArticles.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{displayArticles.length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Region Cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
          {selectedRegion ? "All Regions" : "Select a Region"}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {sortedRegions.map(([region, data]) => {
            const isActive = selectedRegion === region;
            return (
              <button
                key={region}
                onClick={() => handleRegionClick(region)}
                className="text-left w-full"
              >
                <Card className={cn(
                  "transition-all",
                  isActive
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "hover:border-primary/20 hover:bg-accent/30"
                )}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{region}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{data.total} reports</span>
                        {data.critical > 0 && (
                          <span className="text-[10px] text-threat-critical font-medium">
                            {data.critical} critical
                          </span>
                        )}
                        {data.high > 0 && (
                          <span className="text-[10px] text-threat-high font-medium">
                            {data.high} high
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-lg font-bold text-primary">{data.total}</span>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
