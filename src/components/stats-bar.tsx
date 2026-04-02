import { fetchArticles } from "@/lib/queries";

export async function StatsBar() {
  const articles = await fetchArticles();
  const criticalCount = articles.filter((a) => a.threatLevel === "critical").length;
  const highCount = articles.filter((a) => a.threatLevel === "high").length;
  const allCves = new Set(articles.flatMap((a) => a.cves));
  const allActors = new Set(articles.flatMap((a) => a.threatActors).filter(Boolean));

  const stats = [
    { label: "CVEs Tracked", value: allCves.size, color: "text-primary", glow: "shadow-primary/10" },
    { label: "Critical Threats", value: criticalCount, color: "text-threat-critical", glow: "shadow-threat-critical/10" },
    { label: "High Threats", value: highCount, color: "text-threat-high", glow: "shadow-threat-high/10" },
    { label: "Threat Actors", value: allActors.size, color: "text-threat-medium", glow: "shadow-threat-medium/10" },
  ];

  return (
    <div className="border-y border-border bg-gradient-to-r from-card/80 via-card/50 to-card/80">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-4 text-center sm:px-6 group">
            <div className={`font-mono text-3xl font-bold ${stat.color} drop-shadow-sm`}>
              {stat.value}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
