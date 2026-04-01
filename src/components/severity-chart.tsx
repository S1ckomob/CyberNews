import type { Article } from "@/lib/types";

export function SeverityChart({ articles }: { articles: Article[] }) {
  const counts = {
    critical: articles.filter((a) => a.threatLevel === "critical").length,
    high: articles.filter((a) => a.threatLevel === "high").length,
    medium: articles.filter((a) => a.threatLevel === "medium").length,
    low: articles.filter((a) => a.threatLevel === "low").length,
  };
  const total = articles.length || 1;

  const segments = [
    { level: "critical", count: counts.critical, color: "var(--threat-critical)" },
    { level: "high", count: counts.high, color: "var(--threat-high)" },
    { level: "medium", count: counts.medium, color: "var(--threat-medium)" },
    { level: "low", count: counts.low, color: "var(--threat-low)" },
  ];

  let cumulative = 0;
  const gradientStops = segments.map((s) => {
    const start = (cumulative / total) * 100;
    cumulative += s.count;
    const end = (cumulative / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  }).join(", ");

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Donut */}
      <div className="relative">
        <div
          className="h-36 w-36 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops})`,
          }}
        />
        <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold">{total}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {segments.map((s) => (
          <div key={s.level} className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="capitalize text-muted-foreground">{s.level}</span>
            <span className="font-mono font-bold ml-auto">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
