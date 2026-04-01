export const revalidate = 60;

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { ThreatBadge } from "@/components/threat-badge";
import { getSupabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Shield,
  Monitor,
  AlertTriangle,
  Tag,
  Calendar,
  Bug,
} from "lucide-react";

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id, title: row.title, slug: row.slug, summary: row.summary,
    content: row.content, threatLevel: row.threat_level,
    category: row.category as Article["category"], cves: row.cves,
    affectedProducts: row.affected_products, threatActors: row.threat_actors,
    industries: row.industries as Article["industries"],
    attackVector: row.attack_vector, source: row.source, sourceUrl: row.source_url,
    publishedAt: row.published_at, updatedAt: row.updated_at,
    discoveredAt: row.discovered_at ?? "", exploitedAt: row.exploited_at ?? undefined,
    patchedAt: row.patched_at ?? undefined, verified: row.verified,
    verifiedBy: row.verified_by, tags: row.tags, region: row.region,
  };
}

export const metadata = {
  title: "Windows Vulnerabilities & Patches",
  description:
    "Track Windows vulnerabilities, CVEs, Patch Tuesday updates, and Microsoft security advisories.",
};

export default async function WindowsPage() {
  const supabase = getSupabase();

  // Fetch articles mentioning Windows/Microsoft in products, title, or tags
  const { data: rows } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  const allArticles = (rows || []).map(rowToArticle);

  const windowsKeywords = [
    "windows", "microsoft", "ntlm", "active directory", "hyper-v",
    "exchange", "outlook", "office", "azure ad", "entra", "patch tuesday",
    "msrc", "defender", ".net", "iis", "sharepoint", "teams",
  ];

  const windowsArticles = allArticles.filter((a) => {
    const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.tags.join(" ")} ${a.cves.join(" ")}`.toLowerCase();
    return windowsKeywords.some((kw) => text.includes(kw));
  });

  const criticalWindows = windowsArticles.filter((a) => a.threatLevel === "critical");
  const zeroDayWindows = windowsArticles.filter(
    (a) => a.category === "zero-day" || a.tags.includes("zero-day") || a.tags.includes("patch-tuesday")
  );
  const allCves = [...new Set(windowsArticles.flatMap((a) => a.cves))];
  const patchTuesday = windowsArticles.filter(
    (a) => a.title.toLowerCase().includes("patch tuesday") || a.tags.includes("patch-tuesday")
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Monitor className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Windows Security Intelligence
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Vulnerabilities, CVEs, Patch Tuesday, and Microsoft security advisories
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {windowsArticles.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Reports
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {criticalWindows.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Critical
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-high">
              {allCves.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              CVEs Tracked
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-medium">
              {zeroDayWindows.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Zero-Days
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Patch Tuesday */}
          {patchTuesday.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Patch Tuesday
                </h2>
              </div>
              <div className="space-y-3">
                {patchTuesday.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
              </div>
            </div>
          )}

          {/* Zero-Days */}
          {zeroDayWindows.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-4 w-4 text-threat-critical" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
                  Active Zero-Days
                </h2>
              </div>
              <div className="space-y-3">
                {zeroDayWindows.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* All Windows articles */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
              All Windows & Microsoft Reports ({windowsArticles.length})
            </h2>
            {windowsArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No Windows-related articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {windowsArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Windows CVEs */}
          {allCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Windows CVEs ({allCves.length})
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {allCves.slice(0, 15).map((cve) => (
                    <Link
                      key={cve}
                      href={`/cve?q=${cve}`}
                      className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-threat-high" />
                      {cve}
                    </Link>
                  ))}
                  {allCves.length > 15 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{allCves.length - 15} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Affected Products
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(
                  windowsArticles.flatMap((a) =>
                    a.affectedProducts.filter((p) =>
                      windowsKeywords.some((kw) => p.toLowerCase().includes(kw))
                    )
                  )
                )]
                  .slice(0, 20)
                  .map((product) => (
                    <Badge key={product} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          {criticalWindows.length > 0 && (
            <Card className="border-threat-critical/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-threat-critical" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    Critical Windows Threats
                  </h3>
                </div>
                <div className="space-y-1">
                  {criticalWindows.slice(0, 5).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
