"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { WORLD_PATH } from "@/lib/world-map-path";
import { resolveArticleLocations, aggregateByPoint, type AggregatedPoint } from "@/lib/geo-resolve";
import { ThreatBadge } from "@/components/threat-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const THREAT_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#6b7280",
};

function formatDate(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  if (diffM < 1) return "Just now";
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ThreatMapProps {
  articles: Article[];
  compact?: boolean;
}

export function ThreatMap({ articles, compact = false }: ThreatMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points = useMemo(() => {
    const threats = resolveArticleLocations(articles);
    return aggregateByPoint(threats);
  }, [articles]);

  const selected = points.find((p) => p.point.id === selectedId);

  // Find all points that share articles with the selected point
  const relatedPointIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const articleIds = new Set(selected.articles.map((a) => a.id));
    const related = new Set<string>();
    for (const pt of points) {
      if (pt.articles.some((a) => articleIds.has(a.id))) {
        related.add(pt.point.id);
      }
    }
    return related;
  }, [selected, points]);

  const viewBox = compact ? "30 60 940 380" : "0 20 1000 460";

  return (
    <div className={cn("relative select-none", compact ? "h-[180px]" : "")}>
      <div className={cn(selected && !compact ? "grid gap-4 lg:grid-cols-[1fr_350px]" : "")}>
        {/* Map */}
        <div className={cn(compact ? "h-[180px]" : "h-[420px]")}>
          <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <rect x="0" y="0" width="1000" height="500" fill="transparent" />

            {/* Graticule */}
            <g opacity="0.04" stroke="currentColor" strokeWidth="0.5">
              {[100, 150, 200, 250, 300, 350, 400].map((y) => (
                <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} />
              ))}
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" />
              ))}
            </g>

            {/* Land */}
            <path
              d={WORLD_PATH}
              fill="currentColor"
              opacity="0.08"
              stroke="currentColor"
              strokeWidth="0.4"
              strokeOpacity="0.2"
              strokeLinejoin="round"
            />

            {/* Threat dots */}
            {/* Threat dots */}
            {points.map((pt) => {
              const color = THREAT_COLORS[pt.maxLevel] || THREAT_COLORS.medium;
              const isSelected = selectedId === pt.point.id;
              const isRelated = relatedPointIds.has(pt.point.id) && selectedId !== null;
              const isHighlighted = isSelected || isRelated;
              const isDimmed = selectedId !== null && !isHighlighted;
              const radius = compact
                ? Math.min(2.5 + pt.count * 0.8, 8)
                : Math.min(4 + pt.count * 1, 14);

              return (
                <g
                  key={pt.point.id}
                  onClick={() => !compact && setSelectedId(isSelected ? null : pt.point.id)}
                  className={cn(!compact && "cursor-pointer")}
                >
                  {isSelected && (
                    <circle cx={pt.point.x} cy={pt.point.y} r={radius + 7}
                      fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
                  )}
                  {isRelated && !isSelected && (
                    <circle cx={pt.point.x} cy={pt.point.y} r={radius + 6}
                      fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
                  )}
                  {pt.maxLevel === "critical" && !isDimmed && (
                    <circle cx={pt.point.x} cy={pt.point.y} r={radius + 4}
                      fill="none" stroke={color} strokeWidth="0.8" opacity="0.3" className="animate-threat-pulse" />
                  )}
                  <circle cx={pt.point.x} cy={pt.point.y} r={radius + 3}
                    fill={color} opacity={isHighlighted ? "0.25" : isDimmed ? "0" : "0.08"} />
                  {!compact && (
                    <circle cx={pt.point.x} cy={pt.point.y} r={radius + 8}
                      fill="transparent" />
                  )}
                  <circle cx={pt.point.x} cy={pt.point.y} r={radius}
                    fill={color} opacity={isHighlighted ? "1" : isDimmed ? "0.08" : "0.75"} />
                  {!compact && pt.count > 1 && radius >= 6 && !isDimmed && (
                    <text x={pt.point.x} y={pt.point.y + 1}
                      textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize="7" fontWeight="700" fontFamily="monospace">
                      {pt.count}
                    </text>
                  )}
                  {!compact && (
                    <text x={pt.point.x} y={pt.point.y + radius + 10}
                      textAnchor="middle" fill="currentColor"
                      fontSize="6" fontWeight="600" opacity={isHighlighted ? "0.8" : isDimmed ? "0" : "0.25"}
                      fontFamily="monospace">
                      {pt.point.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {!compact && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="text-muted-foreground/50">Click a region to see threats — connected regions will highlight</span>
                <span className="ml-auto" />
                {(["critical", "high", "medium", "low"] as const).map((level) => (
                  <span key={level} className="flex items-center gap-1 capitalize">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: THREAT_COLORS[level] }} />
                    {level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Panel */}
        {selected && !compact && (
          <Card className="h-[420px] overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold">{selected.point.label}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {selected.articles.length} threat{selected.articles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button onClick={() => setSelectedId(null)}
                  className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {selected.articles.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`}
                    className="flex items-start gap-2 border-b border-border p-3 hover:bg-accent/50 transition-colors">
                    <div className={cn(
                      "mt-1 w-1 shrink-0 self-stretch rounded-full",
                      article.threatLevel === "critical" ? "bg-threat-critical" :
                      article.threatLevel === "high" ? "bg-threat-high" :
                      article.threatLevel === "medium" ? "bg-threat-medium" : "bg-threat-low"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <ThreatBadge level={article.threatLevel} size="sm" />
                        <Badge variant="outline" className="text-[9px] font-mono">{article.category}</Badge>
                      </div>
                      <h4 className="text-xs font-medium leading-tight line-clamp-2">{article.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="font-mono">{article.source}</span>
                      </div>
                      {article.cves.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {article.cves.slice(0, 2).map((cve) => (
                            <span key={cve} className="font-mono text-[9px] text-threat-high bg-threat-high/10 px-1 rounded">
                              {cve}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
