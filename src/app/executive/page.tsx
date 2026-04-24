export const revalidate = 60;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SeverityChart } from "@/components/severity-chart";
import { PDFExportButton } from "@/components/pdf-export-button";
import { ArticleCard } from "@/components/article-card";
import { fetchArticles, fetchThreatActors } from "@/lib/queries";
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Bug, Lock, Users, Target, BarChart3, Clock, CheckCircle,
  XCircle, ArrowRight, Zap, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
  const last24h = articles.filter((a) => now.getTime() - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000);

  const critical7d = last7d.filter((a) => a.threatLevel === "critical").length;
  const criticalPrev = prev7d.filter((a) => a.threatLevel === "critical").length;
  const high7d = last7d.filter((a) => a.threatLevel === "high").length;
  const zeroDays7d = last7d.filter((a) => a.category === "zero-day" || a.tags.some((t) => t.includes("zero-day")));
  const ransomware7d = last7d.filter((a) => a.category === "ransomware" || a.tags.some((t) => t.includes("ransomware")));
  const supplyChain7d = last7d.filter((a) => a.category === "supply-chain");
  const ai7d = last7d.filter((a) => {
    if (a.category === "ai") return true;
    const hay = `${a.title} ${a.summary} ${a.tags.join(" ")}`.toLowerCase();
    return /prompt injection|jailbreak|llm|large language model|generative ai|model poisoning|deepfake|chatgpt|copilot|anthropic|claude |gemini|agentic|model context protocol/.test(hay);
  });
  const aiPrev7d = prev7d.filter((a) => a.category === "ai").length;
  const aiChange = aiPrev7d > 0 ? Math.round(((ai7d.length - aiPrev7d) / aiPrev7d) * 100) : 0;
  const exploited7d = last7d.filter((a) => a.exploitedAt).length;
  const cves7d = [...new Set(last7d.flatMap((a) => a.cves))];
  const activeActors = [...new Set(last7d.flatMap((a) => a.threatActors).filter(Boolean))];
  const sources7d = [...new Set(last7d.map((a) => a.source))];

  // Top critical threats for detail section
  const topCritical = last7d.filter((a) => a.threatLevel === "critical").slice(0, 5);

  // Risk level
  let riskLevel = "GUARDED";
  let riskColor = "text-primary";
  let riskBg = "";
  if (critical7d >= 5 || zeroDays7d.length >= 3) { riskLevel = "CRITICAL"; riskColor = "text-threat-critical"; riskBg = "border-threat-critical/30 bg-threat-critical/5"; }
  else if (critical7d >= 2 || zeroDays7d.length >= 1) { riskLevel = "HIGH"; riskColor = "text-threat-high"; riskBg = "border-threat-high/30 bg-threat-high/5"; }
  else if (critical7d >= 1) { riskLevel = "ELEVATED"; riskColor = "text-threat-medium"; riskBg = "border-threat-medium/20 bg-threat-medium/5"; }

  // Trends
  const totalChange = prev7d.length > 0 ? Math.round(((last7d.length - prev7d.length) / prev7d.length) * 100) : 0;
  const criticalChange = criticalPrev > 0 ? Math.round(((critical7d - criticalPrev) / criticalPrev) * 100) : 0;

  // Category breakdown
  const catCounts: Record<string, number> = {};
  last7d.forEach((a) => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Industry breakdown
  const indCounts: Record<string, number> = {};
  last7d.forEach((a) => a.industries.forEach((i) => { indCounts[i] = (indCounts[i] || 0) + 1; }));
  const topIndustries = Object.entries(indCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Daily volume for the week (simple sparkline data)
  const dailyVolume: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = last7d.filter((a) => {
      const d = new Date(a.publishedAt);
      return d >= dayStart && d < dayEnd;
    }).length;
    dailyVolume.push({ day: dayStart.toLocaleDateString("en-US", { weekday: "short" }), count });
  }
  const maxDaily = Math.max(...dailyVolume.map((d) => d.count), 1);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  function TrendArrow({ change }: { change: number }) {
    if (change > 10) return <TrendingUp className="h-3 w-3 text-threat-critical" />;
    if (change < -10) return <TrendingDown className="h-3 w-3 text-primary" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Executive Risk Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground">{dateStr} · 7-day rolling window · {sources7d.length} verified sources</p>
        </div>
        <PDFExportButton />
      </div>

      {/* Risk Level Banner */}
      <Card className={cn("mb-6", riskBg)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Overall Threat Posture
              </div>
              <div className={cn("text-4xl font-bold tracking-tight", riskColor)}>
                {riskLevel}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Week-over-Week</div>
              <div className="flex items-center justify-end gap-1">
                <TrendArrow change={totalChange} />
                <span className={cn("text-lg font-mono font-bold", totalChange > 10 ? "text-threat-critical" : totalChange < -10 ? "text-primary" : "text-muted-foreground")}>
                  {totalChange > 0 ? "+" : ""}{totalChange}%
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">total threat volume</div>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {riskLevel === "CRITICAL"
              ? `The organization faces an elevated threat environment with ${critical7d} critical threats and ${zeroDays7d.length} actively exploited zero-day${zeroDays7d.length !== 1 ? "s" : ""} detected this week. Immediate executive attention and cross-functional incident response coordination is recommended.`
              : riskLevel === "HIGH"
              ? `Active critical threats detected in the landscape. ${critical7d} critical-severity reports and ${zeroDays7d.length > 0 ? `${zeroDays7d.length} zero-day exploit${zeroDays7d.length !== 1 ? "s" : ""}` : "elevated threat actor activity"} require security team review and accelerated patching cycles.`
              : riskLevel === "ELEVATED"
              ? `Moderate threat activity with ${critical7d} critical report${critical7d !== 1 ? "s" : ""} this week. Standard monitoring procedures and scheduled patch windows should be maintained with attention to emerging threats.`
              : `The threat landscape is within normal parameters. ${last7d.length} reports processed from ${sources7d.length} sources with no critical escalations required.`}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 mb-6">
        {[
          { label: "Total (7d)", value: last7d.length, change: totalChange, color: "text-foreground" },
          { label: "Critical", value: critical7d, change: criticalChange, color: "text-threat-critical" },
          { label: "Zero-Days", value: zeroDays7d.length, color: "text-threat-high" },
          { label: "Ransomware", value: ransomware7d.length, color: "text-threat-high" },
          { label: "AI Threats", value: ai7d.length, change: aiChange, color: "text-primary" },
          { label: "Exploited", value: exploited7d, color: "text-threat-critical" },
          { label: "CVEs", value: cves7d.length, color: "text-primary" },
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

      {/* Daily Volume Chart + Severity Distribution */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4">Daily Threat Volume (7d)</h2>
            <div className="flex items-end gap-1.5 h-32">
              {dailyVolume.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-[9px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4">Severity Distribution (7d)</h2>
            <SeverityChart articles={last7d} />
          </CardContent>
        </Card>
      </div>

      {/* Top Critical Threats */}
      {topCritical.length > 0 && (
        <Card className="mb-6 border-threat-critical/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-threat-critical" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                Critical Threats Requiring Attention
              </h2>
            </div>
            <div className="space-y-3">
              {topCritical.map((a) => (
                <ArticleCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Top Threat Categories */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Threat Categories</h2>
            </div>
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

        {/* Industries at Risk */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Industries at Risk</h2>
            </div>
            <div className="space-y-3">
              {topIndustries.map(([ind, count]) => (
                <div key={ind} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{ind}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-muted w-24">
                      <div className="h-2 rounded-full bg-threat-high" style={{ width: `${(count / last7d.length) * 100}%` }} />
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
              <h2 className="text-xs font-semibold uppercase tracking-wider">Active Threat Actors ({activeActors.length})</h2>
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

        {/* Notable CVEs */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bug className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">CVEs This Week ({cves7d.length})</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cves7d.slice(0, 15).map((cve) => (
                <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noopener noreferrer">
                  <Badge variant="secondary" className="font-mono text-[10px] hover:bg-accent cursor-pointer">{cve}</Badge>
                </a>
              ))}
              {cves7d.length > 15 && (
                <Badge variant="secondary" className="text-[10px]">+{cves7d.length - 15} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Recommended Actions</h2>
          </div>
          <div className="space-y-3">
            {critical7d > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-threat-critical/10 text-threat-critical text-[10px] font-bold shrink-0">1</span>
                <div>
                  <span className="font-semibold text-foreground">Immediate:</span>{" "}
                  <span className="text-muted-foreground">Review {critical7d} critical threat{critical7d !== 1 ? "s" : ""} and assess organizational exposure. Prioritize patching for {cves7d.length > 0 ? `${cves7d.length} tracked CVE${cves7d.length !== 1 ? "s" : ""}` : "any affected systems"}.</span>
                </div>
              </div>
            )}
            {zeroDays7d.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-threat-high/10 text-threat-high text-[10px] font-bold shrink-0">{critical7d > 0 ? "2" : "1"}</span>
                <div>
                  <span className="font-semibold text-foreground">Zero-Day Response:</span>{" "}
                  <span className="text-muted-foreground">{zeroDays7d.length} actively exploited zero-day{zeroDays7d.length !== 1 ? "s" : ""} detected. Verify compensating controls are in place and monitor vendor advisory channels for patches.</span>
                </div>
              </div>
            )}
            {ransomware7d.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-threat-high/10 text-threat-high text-[10px] font-bold shrink-0">{(critical7d > 0 ? 1 : 0) + (zeroDays7d.length > 0 ? 1 : 0) + 1}</span>
                <div>
                  <span className="font-semibold text-foreground">Ransomware Posture:</span>{" "}
                  <span className="text-muted-foreground">{ransomware7d.length} ransomware report{ransomware7d.length !== 1 ? "s" : ""} this week. Validate backup integrity, test recovery procedures, and review endpoint detection coverage.</span>
                </div>
              </div>
            )}
            {ai7d.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">{(critical7d > 0 ? 1 : 0) + (zeroDays7d.length > 0 ? 1 : 0) + (ransomware7d.length > 0 ? 1 : 0) + 1}</span>
                <div>
                  <span className="font-semibold text-foreground">AI Governance:</span>{" "}
                  <span className="text-muted-foreground">{ai7d.length} AI/ML-related report{ai7d.length !== 1 ? "s" : ""} this week. Inventory internal LLM and agent deployments, enforce prompt-injection controls on user-facing AI features, and monitor vendor AI product advisories.</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                {(critical7d > 0 ? 1 : 0) + (zeroDays7d.length > 0 ? 1 : 0) + (ransomware7d.length > 0 ? 1 : 0) + (ai7d.length > 0 ? 1 : 0) + 1}
              </span>
              <div>
                <span className="font-semibold text-foreground">Ongoing:</span>{" "}
                <span className="text-muted-foreground">Maintain threat intelligence monitoring across {sources7d.length} sources. Ensure security teams review the daily briefing and escalate high-severity findings within SLA.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3">Intelligence Summary</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-critical shrink-0" />
              {critical7d} critical and {high7d} high-severity threats detected across {last7d.length} reports this week
              {criticalChange !== 0 ? ` (${criticalChange > 0 ? "up" : "down"} ${Math.abs(criticalChange)}% critical vs. last week)` : ""}.
            </li>
            {zeroDays7d.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-high shrink-0" />
                {zeroDays7d.length} actively exploited zero-day{zeroDays7d.length > 1 ? "s" : ""} in the wild requiring immediate vendor patch monitoring.
              </li>
            )}
            {ransomware7d.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-high shrink-0" />
                {ransomware7d.length} ransomware-related intelligence report{ransomware7d.length > 1 ? "s" : ""}. {activeActors.filter((a) => ["LockBit", "Cl0p", "BlackCat", "ALPHV", "Black Basta", "RansomHub", "Akira", "Rhysida", "Medusa", "Play"].some((rg) => a.includes(rg))).length > 0 ? `Active groups: ${activeActors.filter((a) => ["LockBit", "Cl0p", "BlackCat", "ALPHV", "Black Basta", "RansomHub", "Akira", "Rhysida", "Medusa", "Play"].some((rg) => a.includes(rg))).join(", ")}.` : ""}
              </li>
            )}
            {supplyChain7d.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-medium shrink-0" />
                {supplyChain7d.length} supply chain threat{supplyChain7d.length > 1 ? "s" : ""} detected — review third-party dependencies and software bill of materials.
              </li>
            )}
            {ai7d.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {ai7d.length} AI/ML security report{ai7d.length > 1 ? "s" : ""} this week
                {aiChange !== 0 ? ` (${aiChange > 0 ? "up" : "down"} ${Math.abs(aiChange)}% vs. prior week)` : ""}
                {" "}— review LLM, agent, and copilot exposure across internal and vendor AI systems.
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {cves7d.length} new CVEs tracked from {sources7d.length} verified intelligence sources. {last24h.length} reports in the last 24 hours.
            </li>
            {activeActors.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-threat-high shrink-0" />
                {activeActors.length} named threat actor{activeActors.length > 1 ? "s" : ""} active this week: {activeActors.slice(0, 5).join(", ")}{activeActors.length > 5 ? ` and ${activeActors.length - 5} more` : ""}.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Generated by Security Intel Hub · {dateStr} · Data from {sources7d.length} verified sources</span>
        <Link href="/intelligence" className="text-primary hover:underline flex items-center gap-1">
          Full Intelligence Feed <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
