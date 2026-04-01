import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

type GlobalLevel = "CRITICAL" | "HIGH" | "ELEVATED" | "GUARDED";

function computeGlobalLevel(articles: Article[]): GlobalLevel {
  const now = new Date();
  const last24h = articles.filter(
    (a) => now.getTime() - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000
  );
  const criticalCount = last24h.filter((a) => a.threatLevel === "critical").length;
  const highCount = last24h.filter((a) => a.threatLevel === "high").length;

  if (criticalCount >= 3) return "CRITICAL";
  if (criticalCount >= 1) return "HIGH";
  if (highCount >= 3) return "ELEVATED";
  return "GUARDED";
}

const LEVEL_CONFIG: Record<GlobalLevel, { color: string; bg: string; border: string; pulse: boolean }> = {
  CRITICAL: { color: "text-threat-critical", bg: "bg-threat-critical/10", border: "border-threat-critical/30", pulse: true },
  HIGH: { color: "text-threat-high", bg: "bg-threat-high/8", border: "border-threat-high/25", pulse: false },
  ELEVATED: { color: "text-threat-medium", bg: "bg-threat-medium/8", border: "border-threat-medium/25", pulse: false },
  GUARDED: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/15", pulse: false },
};

export function ThreatLevelIndicator({ articles }: { articles: Article[] }) {
  const level = computeGlobalLevel(articles);
  const config = LEVEL_CONFIG[level];
  const now = new Date();
  const last24h = articles.filter(
    (a) => now.getTime() - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000
  );

  return (
    <div className={cn("border-y", config.border, config.bg)}>
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
              "h-2 w-2 rounded-full",
              config.color.replace("text-", "bg-"),
              config.pulse && "animate-threat-pulse"
            )} />
            <span className={cn("font-mono text-xs font-bold uppercase tracking-widest", config.color)}>
              Global Threat Level: {level}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
            <span>{last24h.length} reports (24h)</span>
            <span>{last24h.filter((a) => a.threatLevel === "critical").length} critical</span>
            <span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
