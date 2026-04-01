export const revalidate = 60;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchArticles } from "@/lib/queries";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Threat Trends & Analytics",
  description: "Cybersecurity threat trends, category shifts, and intelligence analytics over time.",
};

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekKey(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return getDayKey(d);
}

export default async function TrendsPage() {
  const articles = await fetchArticles();
  const now = new Date();

  // Time windows
  const last7d = articles.filter((a) => now.getTime() - new Date(a.publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000);
  const prev7d = articles.filter((a) => {
    const age = now.getTime() - new Date(a.publishedAt).getTime();
    return age >= 7 * 24 * 60 * 60 * 1000 && age < 14 * 24 * 60 * 60 * 1000;
  });

  // Category trends (this week vs last week)
  function countByCategory(arts: typeof articles) {
    const counts: Record<string, number> = {};
    arts.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return counts;
  }

  const thisWeekCats = countByCategory(last7d);
  const lastWeekCats = countByCategory(prev7d);

  const categoryTrends = Object.keys({ ...thisWeekCats, ...lastWeekCats })
    .map((cat) => {
      const current = thisWeekCats[cat] || 0;
      const previous = lastWeekCats[cat] || 0;
      const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
      return { category: cat, current, previous, change };
    })
    .sort((a, b) => b.current - a.current);

  // Severity trends
  const severityThis = { critical: 0, high: 0, medium: 0, low: 0 };
  const severityPrev = { critical: 0, high: 0, medium: 0, low: 0 };
  last7d.forEach((a) => { severityThis[a.threatLevel as keyof typeof severityThis]++; });
  prev7d.forEach((a) => { severityPrev[a.threatLevel as keyof typeof severityPrev]++; });

  // Daily volume (last 14 days)
  const dailyCounts: Record<string, number> = {};
  const last14d = articles.filter((a) => now.getTime() - new Date(a.publishedAt).getTime() < 14 * 24 * 60 * 60 * 1000);
  last14d.forEach((a) => {
    const key = getDayKey(new Date(a.publishedAt));
    dailyCounts[key] = (dailyCounts[key] || 0) + 1;
  });

  // Get last 14 day keys in order
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayKeys.push(getDayKey(d));
  }

  const maxDaily = Math.max(...dayKeys.map((k) => dailyCounts[k] || 0), 1);

  // Top threat actors this week
  const actorCounts: Record<string, number> = {};
  last7d.forEach((a) => a.threatActors.filter(Boolean).forEach((t) => { actorCounts[t] = (actorCounts[t] || 0) + 1; }));
  const topActors = Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Top industries this week
  const industryCounts: Record<string, number> = {};
  last7d.forEach((a) => a.industries.forEach((i) => { industryCounts[i] = (industryCounts[i] || 0) + 1; }));
  const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Top sources
  const sourceCounts: Record<string, number> = {};
  last7d.forEach((a) => { sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1; });
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Week-over-week total change
  const totalChange = prev7d.length > 0
    ? Math.round(((last7d.length - prev7d.length) / prev7d.length) * 100)
    : 0;

  function TrendIcon({ change }: { change: number }) {
    if (change > 10) return <TrendingUp className="h-3.5 w-3.5 text-threat-critical" />;
    if (change < -10) return <TrendingDown className="h-3.5 w-3.5 text-primary" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }

  function trendColor(change: number) {
    if (change > 10) return "text-threat-critical";
    if (change < -10) return "text-primary";
    return "text-muted-foreground";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Threat Trends & Analytics</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Week-over-week intelligence trends and threat landscape shifts
      </p>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-mono font-bold">{last7d.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">This Week</div>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon change={totalChange} />
                <span className={cn("text-xs font-mono font-bold", trendColor(totalChange))}>
                  {totalChange > 0 ? "+" : ""}{totalChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        {(["critical", "high", "medium", "low"] as const).map((level) => {
          const curr = severityThis[level];
          const prev = severityPrev[level];
          const change = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;
          return (
            <Card key={level}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xl font-mono font-bold text-threat-${level}`}>{curr}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{level}</div>
                  </div>
                  {prev > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendIcon change={change} />
                      <span className={cn("text-xs font-mono", trendColor(change))}>
                        {change > 0 ? "+" : ""}{change}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }).slice(0, 3)}
      </div>

      {/* Daily Volume Chart (pure CSS) */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Daily Report Volume (14 days)</h2>
          </div>
          <div className="flex items-end gap-1 h-32">
            {dayKeys.map((key) => {
              const count = dailyCounts[key] || 0;
              const height = (count / maxDaily) * 100;
              const isToday = key === getDayKey(now);
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1" title={`${key}: ${count} articles`}>
                  <span className="text-[9px] font-mono text-muted-foreground">{count || ""}</span>
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      isToday ? "bg-primary" : "bg-primary/40"
                    )}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-[8px] text-muted-foreground">
                    {key.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Trends */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Category Trends (Week over Week)
            </h2>
            <div className="space-y-3">
              {categoryTrends.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs capitalize text-muted-foreground w-24 truncate">
                      {cat.category.replace("-", " ")}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (cat.current / (last7d.length || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-bold w-6 text-right">{cat.current}</span>
                  </div>
                  <div className="flex items-center gap-1 w-16 justify-end">
                    <TrendIcon change={cat.change} />
                    <span className={cn("text-[10px] font-mono", trendColor(cat.change))}>
                      {cat.change > 0 ? "+" : ""}{cat.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Threat Actors + Industries */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-threat-high" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Most Active Actors (7d)</h2>
              </div>
              {topActors.length > 0 ? (
                <div className="space-y-2">
                  {topActors.map(([actor, count], i) => (
                    <div key={actor} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium">{actor}</span>
                      </div>
                      <span className="font-mono font-bold text-threat-high">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No named actors in the last 7 days.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Top Industries (7d)</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topIndustries.map(([ind, count]) => (
                  <Badge key={ind} variant="outline" className="text-xs capitalize gap-1">
                    {ind}
                    <span className="font-mono text-primary">{count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Top Sources (7d)</h2>
              <div className="space-y-1.5">
                {topSources.map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{source}</span>
                    <span className="font-mono font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
