"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";
import { WORLD_PATH } from "@/lib/world-map-path";
import { cn } from "@/lib/utils";

// Region coordinates on the equirectangular projection (0-1000 x 0-500)
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

interface ThreatMapProps {
  articles: Article[];
  compact?: boolean;
}

export function ThreatMap({ articles, compact = false }: ThreatMapProps) {
  const regionData: Record<string, { count: number; maxLevel: string }> = {};

  for (const article of articles) {
    const region = article.region || "Global";
    if (!regionData[region]) {
      regionData[region] = { count: 0, maxLevel: "low" };
    }
    regionData[region].count++;
    const levels = ["critical", "high", "medium", "low"];
    if (levels.indexOf(article.threatLevel) < levels.indexOf(regionData[region].maxLevel)) {
      regionData[region].maxLevel = article.threatLevel;
    }
  }

  const viewBox = compact ? "30 60 940 380" : "0 20 1000 460";

  return (
    <div className={cn("relative select-none", compact ? "h-[180px]" : "h-[420px]")}>
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Ocean background */}
        <rect x="0" y="0" width="1000" height="500" fill="transparent" />

        {/* Graticule lines */}
        <g opacity="0.04" stroke="currentColor" strokeWidth="0.5">
          {[100, 150, 200, 250, 300, 350, 400].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} />
          ))}
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" />
          ))}
        </g>

        {/* Land masses — real world outline */}
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
          const radius = compact
            ? Math.min(3 + data.count * 1.2, 10)
            : Math.min(5 + data.count * 1.5, 18);

          return (
            <g key={region}>
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
                opacity="0.1"
              />
              {/* Main dot */}
              <circle
                cx={coords.x} cy={coords.y}
                r={radius}
                fill={color}
                opacity="0.75"
              />
              {/* Count label */}
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
              {/* Region label */}
              {!compact && (
                <text
                  x={coords.x} y={coords.y + radius + 11}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="7"
                  fontWeight="600"
                  opacity="0.3"
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
        <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] text-muted-foreground">
          {(["critical", "high", "medium", "low"] as const).map((level) => (
            <span key={level} className="flex items-center gap-1 capitalize">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: THREAT_COLORS[level] }} />
              {level}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
