"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { WORLD_PATH } from "@/lib/world-map-path";
import { ThreatBadge } from "@/components/threat-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const REGION_COORDS: Record<string, { x: number; y: number; label: string }> = {
  "United States": { x: 185, y: 185, label: "US" },
  "North America": { x: 200, y: 170, label: "NA" },
  "North America / Europe": { x: 350, y: 160, label: "NA/EU" },
  "Europe": { x: 520, y: 155, label: "EU" },
  "Europe / NATO": { x: 530, y: 145, label: "NATO" },
  "United Kingdom": { x: 490, y: 140, label: "UK" },
  "Ukraine": { x: 575, y: 150, label: "UA" },
  "Spain / United States": { x: 475, y: 175, label: "ES/US" },
  "Russia": { x: 650, y: 125, label: "RU" },
  "China": { x: 755, y: 195, label: "CN" },
  "Australia": { x: 835, y: 365, label: "AU" },
  "Global": { x: 500, y: 250, label: "GLOBAL" },
  "Middle East": { x: 595, y: 210, label: "ME" },
  "Asia": { x: 730, y: 215, label: "ASIA" },
  "South America": { x: 300, y: 330, label: "SA" },
  "Africa": { x: 525, y: 285, label: "AF" },
  "Allied Nations": { x: 510, y: 160, label: "ALLIED" },
  "United States / Allied Nations": { x: 360, y: 175, label: "US/ALLIED" },
};

const THREAT_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#6b7280",
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - date.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ThreatMapProps {
  articles: Article[];
  compact?: boolean;
}

export function ThreatMap({ articles, compact = false }: ThreatMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionData: Record<string, { count: number; maxLevel: string; articles: Article[] }> = {};

  for (const article of articles) {
    const region = article.region || "Global";
    if (!regionData[region]) {
      regionData[region] = { count: 0, maxLevel: "low", articles: [] };
    }
    regionData[region].count++;
    regionData[region].articles.push(article);
    const levels = ["critical", "high", "medium", "low"];
    if (levels.indexOf(article.threatLevel) < levels.indexOf(regionData[region].maxLevel)) {
      regionData[region].maxLevel = article.threatLevel;
    }
  }

  const viewBox = compact ? "30 60 940 380" : "0 20 1000 460";
  const selectedArticles = selectedRegion ? regionData[selectedRegion]?.articles || [] : [];

  function handleDotClick(region: string) {
    if (compact) return; // Don't open panel on homepage mini-map
    setSelectedRegion(selectedRegion === region ? null : region);
  }

  return (
    <div className={cn("relative select-none", compact ? "h-[180px]" : "")}>
      <div className={cn(selectedRegion && !compact ? "grid gap-4 lg:grid-cols-[1fr_350px]" : "")}>
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
            {Object.entries(regionData).map(([region, data]) => {
              const coords = REGION_COORDS[region];
              if (!coords) return null;

              const color = THREAT_COLORS[data.maxLevel] || THREAT_COLORS.medium;
              const isSelected = selectedRegion === region;
              const radius = compact
                ? Math.min(3 + data.count * 1.2, 10)
                : Math.min(5 + data.count * 1.5, 18);

              return (
                <g
                  key={region}
                  onClick={() => handleDotClick(region)}
                  className={cn(!compact && "cursor-pointer")}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={coords.x} cy={coords.y}
                      r={radius + 8}
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      opacity="0.6"
                    />
                  )}
                  {/* Pulse ring for critical */}
                  {data.maxLevel === "critical" && (
                    <circle
                      cx={coords.x} cy={coords.y}
                      r={radius + 5}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.3"
                      className="animate-threat-pulse"
                    />
                  )}
                  {/* Glow */}
                  <circle
                    cx={coords.x} cy={coords.y}
                    r={radius + 4}
                    fill={color}
                    opacity={isSelected ? "0.25" : "0.1"}
                  />
                  {/* Hover target (larger invisible circle) */}
                  {!compact && (
                    <circle
                      cx={coords.x} cy={coords.y}
                      r={radius + 10}
                      fill="transparent"
                    />
                  )}
                  {/* Main dot */}
                  <circle
                    cx={coords.x} cy={coords.y}
                    r={radius}
                    fill={color}
                    opacity={isSelected ? "1" : "0.75"}
                  />
                  {/* Count */}
                  {!compact && data.count > 1 && (
                    <text
                      x={coords.x} y={coords.y + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {data.count}
                    </text>
                  )}
                  {/* Label */}
                  {!compact && (
                    <text
                      x={coords.x} y={coords.y + radius + 11}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="7"
                      fontWeight="600"
                      opacity={isSelected ? "0.7" : "0.3"}
                      fontFamily="monospace"
                    >
                      {coords.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          {!compact && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="text-muted-foreground/50">Click a dot to see threats</span>
              <span className="ml-auto" />
              {(["critical", "high", "medium", "low"] as const).map((level) => (
                <span key={level} className="flex items-center gap-1 capitalize">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: THREAT_COLORS[level] }} />
                  {level}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Selected Region Panel */}
        {selectedRegion && !compact && selectedArticles.length > 0 && (
          <Card className="h-[420px] overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold">{selectedRegion}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedArticles.length} threat{selectedArticles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {selectedArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="flex items-start gap-2 border-b border-border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className={cn(
                      "mt-1 w-1 shrink-0 self-stretch rounded-full",
                      article.threatLevel === "critical" ? "bg-threat-critical" :
                      article.threatLevel === "high" ? "bg-threat-high" :
                      article.threatLevel === "medium" ? "bg-threat-medium" :
                      "bg-threat-low"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <ThreatBadge level={article.threatLevel} size="sm" />
                        <Badge variant="outline" className="text-[9px] font-mono">{article.category}</Badge>
                      </div>
                      <h4 className="text-xs font-medium leading-tight line-clamp-2">
                        {article.title}
                      </h4>
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
