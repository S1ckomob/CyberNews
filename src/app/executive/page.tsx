export const revalidate = 60;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SeverityChart } from "@/components/severity-chart";
import { PDFExportButton } from "@/components/pdf-export-button";
import { fetchArticles, fetchThreatActors } from "@/lib/queries";
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Bug, Lock, Users, Target, BarChart3, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive Risk Dashboard",
  description: "Board-ready cybersecurity risk overview with threat trends, severity distribution, and key metrics.",
};

export default async function ExecutivePage() {
  const [articles, actors] = await Promise.all([fetchArticles(), fetchThreatActors()]);

  const now = new Date();
  const last7d = articles.filter((a) => now.getTime() - new Date(a.publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000);
  const prev7d = articles.filter((a) => {
    const age = now.getTime() - new Date(a.publishedAt).getTime();
    return age >= 7 * 24 * 60 * 60 * 1000 && age < 14 * 24 * 60 * 60 * 1000;
  });

  const critical7d = last7d.filter((a) => a.threatLevel === "critical").length;
  const criticalPrev = prev7d.filter((a) => a.threatLevel === "critical").length;
  const zeroDays7d = last7d.filter((a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day"))).length;
  const ransomware7d = last7d.filter((a) => a.category === "ransomware" || a.tags.some((t) => t.includes("ransomware"))).length;
  const exploited7d = last7d.filter((a) => a.exploitedAt).length;
  const cves7d = [...new Set(last7d.flatMap((a) => a.cves))].length;
  const activeActors = [...new Set(last7d.flatMap((a) => a.threatActors).filter(Boolean))];

  // Overall risk level
  let riskLevel = "GUARDED";
  let riskColor = "text-primary";
  if (critical7d >= 5 || zeroDays7d >= 3) { riskLevel = "CRITICAL"; riskColor = "text-threat-critical"; }
  else if (critical7d >= 2 || zeroDays7d >= 1) { riskLevel = "HIGH"; riskColor = "text-threat-high"; }
  else if (critical7d >= 1) { riskLevel = "ELEVATED"; riskColor = "text-threat-medium"; }

  // Trend
  const totalChange = prev7d.length > 0 ? Math.round(((last7d.length - prev7d.length) / prev7d.length) * 100) : 0;
  const criticalChange = criticalPrev > 0 ? Math.round(((critical7d - criticalPrev) / criticalPrev) * 100) : 0;

  function TrendArrow({ change }: { change: number }) {
    if (change > 10) return <TrendingUp className="h-3 w-3 text-threat-critical" />;
    if (change < -10) return <TrendingDown className="h-3 w-3 text-primary" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }

  // Top threat categories this week
  const catCounts: Record<string, number> = {};
  last7d.forEach((a) => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top industries
  const indCounts: Record<string, number> = {};
  last7d.forEach((a) => a.industries.forEach((i) => { indCounts[i] = (indCounts[i] || 0) + 1; }));
  const topIndustries = Object.entries(indCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Executive Risk Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground">{dateStr} · 7-day rolling window</p>
        </div>
        <PDFExportButton />
      </div>

      {/* Risk Level Banner */}
      <Card className={cn("mb-6", riskLevel === "CRITICAL" ? "border-threat-critical/30 bg-threat-critical/5" : riskLevel === "HIGH" ? "border-threat-high/30 bg-threat-high/5" : "")}>
        <CardContent className="p-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Overall Threat Posture
          </div>
          <div className={cn("text-4xl font-bold tracking-tight", riskColor)}>
            {riskLevel}
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto">
            {riskLevel === "CRITICAL" ? "Multiple critical threats and active zero-days detected. Immediate action required across the organization." :
             riskLevel === "HIGH" ? "Active critical threats in the landscape. Security teams should review exposure and prioritize patching." :
             riskLevel === "ELEVATED" ? "Moderate threat activity detected. Standard monitoring and patch cycles recommended." :
             "Threat landscape is within normal parameters. Continue standard security operations."}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        {[
          { label: "Total (7d)", value: last7d.length, change: totalChange, color: "text-foreground" },
          { label: "Critical", value: critical7d, change: criticalChange, color: "text-threat-critical" },
          { label: "Zero-Days", value: zeroDays7d, color: "text-threat-high" },
          { label: "Ransomware", value: ransomware7d, color: "text-threat-high" },
          { label: "Exploited", value: exploited7d, color: "text-threat-critical" },
          { label: "CVEs", value: cves7d, color: "text-primary" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3 text-center">
              <div className={cn("text-xl font-mono font-bold", m.color)}>{m.value}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
              {"change" in m && m.change !== undefined && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendArrow change={m.change} />
                  <span className={cn("text-[10px] font-mono", m.change > 10 ? "text-threat-critical" : m.change < -10 ? "text-primary" : "text-muted-foreground")}>
                    {m.change > 0 ? "+" : ""}{m.change}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Severity Distribution */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4">Severity Distribution (7d)</h2>
            <SeverityChart articles={last7d} />
          </CardContent>
        </Card>

        {/* Top Threat Categories */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4">Top Threat Categories</h2>
            <div className="space-y-3">
              {topCats.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{cat.replace("-", " ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-muted w-24">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(count / last7d.length) * 100}%` }} />
                    </div>
                    <span className="font-mono text-sm font-bold w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Active Threat Actors */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-threat-high" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Active Threat Actors (7d)</h2>
            </div>
            {activeActors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeActors.map((actor) => (
                  <Badge key={actor} variant="outline" className="text-xs font-semibold">{actor}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No named actors in the last 7 days.</p>
            )}
          </CardContent>
        </Card>

        {/* Industries at Risk */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Industries at Risk</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {topIndustries.map(([ind, count]) => (
                <Badge key={ind} variant="outline" className="text-xs capitalize gap-1">
                  {ind} <span className="font-mono text-primary">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Takeaways */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3">Key Takeaways</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-critical shrink-0" />
              {critical7d} critical threats detected this week
              {criticalChange > 0 ? ` (up ${criticalChange}% from last week)` : criticalChange < 0 ? ` (down ${Math.abs(criticalChange)}% from last week)` : ""}.
            </li>
            {zeroDays7d > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-high shrink-0" />
                {zeroDays7d} actively exploited zero-day{zeroDays7d > 1 ? "s" : ""} in the wild.
              </li>
            )}
            {ransomware7d > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-high shrink-0" />
                {ransomware7d} ransomware incident{ransomware7d > 1 ? "s" : ""} reported.
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {cves7d} new CVEs tracked across {articles.length} total intelligence reports.
            </li>
            {activeActors.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-high shrink-0" />
                {activeActors.length} named threat actor{activeActors.length > 1 ? "s" : ""} active: {activeActors.slice(0, 3).join(", ")}{activeActors.length > 3 ? ` +${activeActors.length - 3} more` : ""}.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-4 text-center text-[10px] text-muted-foreground">
        Generated by Security Intel Hub · {dateStr} · Data from {[...new Set(last7d.map((a) => a.source))].length} verified sources
      </div>
    </div>
  );
}
