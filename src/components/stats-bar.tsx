import { fetchArticles } from "@/lib/queries";

export async function StatsBar() {
  const articles = await fetchArticles();
  const criticalCount = articles.filter((a) => a.threatLevel === "critical").length;
  const highCount = articles.filter((a) => a.threatLevel === "high").length;
  const allCves = new Set(articles.flatMap((a) => a.cves));
  const allActors = new Set(articles.flatMap((a) => a.threatActors).filter(Boolean));

  const stats = [
    {
      label: "CVEs Tracked",
      value: allCves.size,
      color: "text-primary",
    },
    {
      label: "Critical Threats",
      value: criticalCount,
      color: "text-threat-critical",
    },
    {
      label: "High Threats",
      value: highCount,
      color: "text-threat-high",
    },
    {
      label: "Threat Actors",
      value: allActors.size,
      color: "text-threat-medium",
    },
  ];

  return (
    <div className="border-y border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-3 text-center sm:px-6">
            <div className={`font-mono text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
