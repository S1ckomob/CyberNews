import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

type GlobalLevel = "CRITICAL" | "HIGH" | "ELEVATED" | "GUARDED";

interface LevelContext {
  level: GlobalLevel;
  criticalCount: number;
  highCount: number;
  totalCount: number;
  zerodays: string[];
  topActors: string[];
  topCategories: string[];
}

function computeGlobalLevel(articles: Article[]): LevelContext {
  const now = new Date();
  const last24h = articles.filter(
    (a) => now.getTime() - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000
  );
  const criticalCount = last24h.filter((a) => a.threatLevel === "critical").length;
  const highCount = last24h.filter((a) => a.threatLevel === "high").length;

  const zerodays = last24h
    .filter((a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day")))
    .map((a) => a.title.slice(0, 60));

  const topActors = [...new Set(last24h.flatMap((a) => a.threatActors))].slice(0, 3);

  const categoryCounts: Record<string, number> = {};
  last24h.forEach((a) => { categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1; });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat.replace("-", " "));

  let level: GlobalLevel;
  if (criticalCount >= 3) level = "CRITICAL";
  else if (criticalCount >= 1) level = "HIGH";
  else if (highCount >= 3) level = "ELEVATED";
  else level = "GUARDED";

  return { level, criticalCount, highCount, totalCount: last24h.length, zerodays, topActors, topCategories };
}

function buildDescription(ctx: LevelContext): string {
  const parts: string[] = [];

  switch (ctx.level) {
    case "CRITICAL":
      parts.push(`${ctx.criticalCount} critical threats detected in the last 24 hours.`);
      if (ctx.zerodays.length > 0) {
        parts.push(`${ctx.zerodays.length} active zero-day${ctx.zerodays.length > 1 ? "s" : ""} reported.`);
      }
      if (ctx.topActors.length > 0) {
        parts.push(`Active threat actors: ${ctx.topActors.join(", ")}.`);
      }
      parts.push("Immediate review of affected systems recommended.");
      break;

    case "HIGH":
      parts.push(`${ctx.criticalCount} critical and ${ctx.highCount} high-severity threats in the last 24 hours.`);
      if (ctx.zerodays.length > 0) {
        parts.push(`Includes ${ctx.zerodays.length} zero-day exploit${ctx.zerodays.length > 1 ? "s" : ""}.`);
      }
      if (ctx.topActors.length > 0) {
        parts.push(`Linked to: ${ctx.topActors.join(", ")}.`);
      }
      parts.push("Review advisories and prioritize patching.");
      break;

    case "ELEVATED":
      parts.push(`${ctx.highCount} high-severity threats detected across ${ctx.totalCount} reports in the last 24 hours.`);
      if (ctx.topCategories.length > 0) {
        parts.push(`Primarily ${ctx.topCategories.join(" and ")} activity.`);
      }
      parts.push("Monitor vendor advisories and ensure patches are current.");
      break;

    case "GUARDED":
      parts.push(`${ctx.totalCount} reports in the last 24 hours with no critical threats.`);
      if (ctx.topCategories.length > 0) {
        parts.push(`Activity mainly in ${ctx.topCategories.join(" and ")}.`);
      }
      parts.push("Maintain standard security posture.");
      break;
  }

  return parts.join(" ");
}

const LEVEL_CONFIG: Record<GlobalLevel, { color: string; bg: string; border: string; pulse: boolean }> = {
  CRITICAL: { color: "text-threat-critical", bg: "bg-threat-critical/10", border: "border-threat-critical/30", pulse: true },
  HIGH: { color: "text-threat-high", bg: "bg-threat-high/8", border: "border-threat-high/25", pulse: false },
  ELEVATED: { color: "text-threat-medium", bg: "bg-threat-medium/8", border: "border-threat-medium/25", pulse: false },
  GUARDED: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/15", pulse: false },
};

export function ThreatLevelIndicator({ articles }: { articles: Article[] }) {
  const ctx = computeGlobalLevel(articles);
  const config = LEVEL_CONFIG[ctx.level];
  const description = buildDescription(ctx);

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
              Global Threat Level: {ctx.level}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
            <span>{ctx.totalCount} reports (24h)</span>
            <span>{ctx.criticalCount} critical</span>
            <span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</span>
          </div>
        </div>
        <div className="mt-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
