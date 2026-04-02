import Link from "next/link";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

// Simplified world map regions with approximate SVG coordinates (0-1000 x 0-500)
const REGION_COORDS: Record<string, { x: number; y: number; label: string }> = {
  "United States": { x: 200, y: 180, label: "US" },
  "North America": { x: 220, y: 160, label: "NA" },
  "North America / Europe": { x: 310, y: 155, label: "NA/EU" },
  "Europe": { x: 500, y: 150, label: "EU" },
  "Europe / NATO": { x: 510, y: 140, label: "NATO" },
  "United Kingdom": { x: 465, y: 130, label: "UK" },
  "Ukraine": { x: 555, y: 150, label: "UA" },
  "Spain / United States": { x: 460, y: 175, label: "ES/US" },
  "Russia": { x: 620, y: 120, label: "RU" },
  "China": { x: 740, y: 200, label: "CN" },
  "Australia": { x: 820, y: 380, label: "AU" },
  "Global": { x: 500, y: 250, label: "GLOBAL" },
  "Middle East": { x: 580, y: 210, label: "ME" },
  "Asia": { x: 720, y: 220, label: "ASIA" },
  "South America": { x: 290, y: 340, label: "SA" },
  "Africa": { x: 510, y: 290, label: "AF" },
  "Allied Nations": { x: 480, y: 165, label: "ALLIED" },
  "United States / Allied Nations": { x: 340, y: 170, label: "US/ALLIED" },
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
  // Group articles by region
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

  const height = compact ? 200 : 400;
  const viewBox = compact ? "50 80 900 350" : "0 0 1000 500";

  // Simplified continent outlines as SVG paths
  const continents = `
    M 120,120 L 140,110 160,105 180,100 200,95 230,100 260,110 280,115 300,118
    L 310,125 305,140 300,160 295,175 285,190 280,200 275,215 270,230
    L 265,245 260,260 250,270 245,280 240,290 235,295 230,300
    L 228,290 225,280 220,270 218,260 215,250 212,240 210,230
    L 205,225 200,218 195,210 190,200 185,195 180,190 175,185
    L 170,178 165,170 160,165 155,158 148,150 140,140 130,130 Z
    M 250,280 L 260,285 270,290 280,300 290,310 295,320 298,335
    L 300,350 298,365 293,375 285,385 278,390 270,388 265,380
    L 260,370 255,355 250,340 248,325 247,310 248,295 Z
    M 430,100 L 445,95 460,92 475,95 490,100 510,105 530,108 550,110
    L 570,108 585,112 600,118 610,125 605,135 598,145 590,155
    L 580,160 570,165 555,170 540,175 525,178 510,180 495,178
    L 480,175 465,172 452,168 445,165 440,158 435,148 432,138
    L 430,128 428,115 Z
    M 475,185 L 490,190 510,195 530,200 550,205 565,215 575,230
    L 580,250 578,270 575,290 570,310 565,325 555,340 545,350
    L 535,355 520,358 505,355 490,348 480,338 475,325 470,310
    L 468,295 467,280 468,265 470,250 472,235 473,220 474,200 Z
    M 600,100 L 620,95 650,90 680,95 710,100 740,108 770,115
    L 800,120 820,128 835,140 840,155 838,170 832,185 825,200
    L 815,215 800,225 785,232 770,238 755,240 740,238 725,235
    L 710,230 700,225 690,218 682,210 675,200 670,190 668,180
    L 665,170 660,160 655,150 648,140 640,132 630,125 618,118
    L 608,110 Z
    M 780,330 L 800,325 820,328 840,335 855,345 865,358
    L 868,372 862,385 852,395 838,400 822,398 808,392
    L 798,382 790,370 785,355 782,342 Z
  `;

  return (
    <div className={cn("relative", compact ? "h-[200px]" : "h-[400px]")}>
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))" }}
      >
        {/* Background */}
        <rect width="1000" height="500" fill="transparent" />

        {/* Grid lines */}
        {!compact && (
          <g opacity="0.05" stroke="currentColor">
            {[100, 200, 300, 400].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} />
            ))}
            {[200, 400, 600, 800].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" />
            ))}
          </g>
        )}

        {/* Continents */}
        <path
          d={continents}
          fill="currentColor"
          opacity="0.06"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.15"
        />

        {/* Threat dots */}
        {Object.entries(regionData).map(([region, data]) => {
          const coords = REGION_COORDS[region];
          if (!coords) return null;

          const color = THREAT_COLORS[data.maxLevel] || THREAT_COLORS.medium;
          const radius = compact
            ? Math.min(4 + data.count * 1.5, 12)
            : Math.min(6 + data.count * 2, 20);
          const pulseRadius = radius + 6;

          return (
            <g key={region}>
              {/* Pulse ring for critical */}
              {data.maxLevel === "critical" && (
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={pulseRadius}
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.4"
                  className="animate-threat-pulse"
                />
              )}
              {/* Glow */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={radius + 3}
                fill={color}
                opacity="0.15"
              />
              {/* Main dot */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={radius}
                fill={color}
                opacity="0.8"
                stroke={color}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              {/* Count */}
              {!compact && data.count > 1 && (
                <text
                  x={coords.x}
                  y={coords.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {data.count}
                </text>
              )}
              {/* Label */}
              {!compact && (
                <text
                  x={coords.x}
                  y={coords.y + radius + 12}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="8"
                  fontWeight="600"
                  opacity="0.4"
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
        <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          {(["critical", "high", "medium", "low"] as const).map((level) => (
            <span key={level} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: THREAT_COLORS[level] }}
              />
              {level}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
