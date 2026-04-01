export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { getSupabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Shield,
  AlertTriangle,
  Tag,
  Bug,
  Server,
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
  title: "Fortinet / FortiGate Security Intelligence",
  description:
    "Track Fortinet and FortiGate vulnerabilities, CVEs, advisories, and threat actor exploitation of Fortinet products.",
};

export default async function FortinetPage() {
  const supabase = getSupabase();

  const { data: rows } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  const allArticles = (rows || []).map(rowToArticle);

  const fortinetKeywords = [
    "fortinet", "fortigate", "fortios", "fortimanager", "fortianalyzer",
    "fortiproxy", "fortisiem", "fortiswitch", "fortiweb", "fortimail",
    "forticlient", "fortiguard", "fortiap", "fortiadc",
  ];

  const fortinetArticles = allArticles.filter((a) => {
    const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.tags.join(" ")} ${a.content}`.toLowerCase();
    return fortinetKeywords.some((kw) => text.includes(kw));
  });

  const criticalFortinet = fortinetArticles.filter((a) => a.threatLevel === "critical");
  const zeroDayFortinet = fortinetArticles.filter(
    (a) => a.category === "zero-day" || a.tags.includes("zero-day") || a.exploitedAt
  );
  const allCves = [...new Set(fortinetArticles.flatMap((a) => a.cves))];
  const allActors = [...new Set(fortinetArticles.flatMap((a) => a.threatActors).filter(Boolean))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Fortinet / FortiGate Security Intelligence
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Vulnerabilities, CVEs, advisories, and threat actor activity targeting Fortinet products
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {fortinetArticles.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Reports
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {criticalFortinet.length}
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
              {zeroDayFortinet.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Actively Exploited
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Critical / Exploited */}
          {criticalFortinet.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
                  Critical Fortinet Threats
                </h2>
              </div>
              <div className="space-y-3">
                {criticalFortinet.slice(0, 2).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
                {criticalFortinet.slice(2).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* All Fortinet articles */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
              All Fortinet Reports ({fortinetArticles.length})
            </h2>
            {fortinetArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No Fortinet-related articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {fortinetArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Fortinet CVEs */}
          {allCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Fortinet CVEs ({allCves.length})
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Threat Actors */}
          {allActors.length > 0 && (
            <Card className="border-threat-high/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Threat Actors Targeting Fortinet
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allActors.map((actor) => (
                    <Badge key={actor} variant="outline" className="text-xs font-semibold">
                      {actor}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Affected Products
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(
                  fortinetArticles.flatMap((a) =>
                    a.affectedProducts.filter((p) =>
                      fortinetKeywords.some((kw) => p.toLowerCase().includes(kw))
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
        </aside>
      </div>
    </div>
  );
}
