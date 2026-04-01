export const revalidate = 60;

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
  Users,
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
  title: "Firewall & Network Edge Security Intelligence",
  description:
    "Track vulnerabilities, CVEs, and threat actor exploitation across all major firewall and network edge platforms — Fortinet, Palo Alto, Cisco, SonicWall, Check Point, Juniper, and more.",
};

const FIREWALL_KEYWORDS = [
  // Fortinet
  "fortinet", "fortigate", "fortios", "fortimanager", "fortianalyzer",
  "fortiproxy", "fortisiem", "fortiswitch", "fortiweb", "fortimail",
  "forticlient", "fortiguard", "fortiap", "fortiadc",
  // Palo Alto
  "palo alto", "pan-os", "panorama", "globalprotect", "prisma",
  // Cisco
  "cisco asa", "cisco firepower", "cisco ftd", "meraki mx",
  // SonicWall
  "sonicwall", "sonicwall sma", "sonicos",
  // Check Point
  "check point", "checkpoint", "gaia",
  // Juniper
  "juniper srx", "junos", "juniper mx",
  // Other network edge
  "pfsense", "opnsense", "watchguard", "sophos xg", "sophos firewall",
  "barracuda", "zyxel", "netgate",
  // General
  "firewall", "network edge", "vpn appliance", "vpn gateway",
  "ivanti connect secure", "ivanti policy secure", "pulse secure",
  "citrix adc", "citrix netscaler", "f5 big-ip",
];

const VENDOR_GROUPS: { name: string; keywords: string[] }[] = [
  { name: "Fortinet", keywords: ["fortinet", "fortigate", "fortios", "fortimanager", "fortiproxy", "fortiguard"] },
  { name: "Palo Alto", keywords: ["palo alto", "pan-os", "globalprotect", "panorama", "prisma"] },
  { name: "Cisco", keywords: ["cisco asa", "cisco firepower", "cisco ftd", "meraki"] },
  { name: "SonicWall", keywords: ["sonicwall", "sonicos"] },
  { name: "Ivanti/Pulse", keywords: ["ivanti connect", "ivanti policy", "pulse secure"] },
  { name: "Juniper", keywords: ["juniper srx", "junos", "juniper mx"] },
  { name: "Check Point", keywords: ["check point", "checkpoint"] },
  { name: "F5", keywords: ["f5 big-ip", "f5 big ip"] },
  { name: "Citrix", keywords: ["citrix adc", "citrix netscaler"] },
  { name: "Other", keywords: ["pfsense", "opnsense", "watchguard", "sophos", "barracuda", "zyxel"] },
];

export default async function FirewallsPage() {
  const supabase = getSupabase();

  const { data: rows } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  const allArticles = (rows || []).map(rowToArticle);

  const firewallArticles = allArticles.filter((a) => {
    const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.tags.join(" ")} ${a.content}`.toLowerCase();
    return FIREWALL_KEYWORDS.some((kw) => text.includes(kw));
  });

  const criticalFw = firewallArticles.filter((a) => a.threatLevel === "critical");
  const exploitedFw = firewallArticles.filter((a) => a.exploitedAt || a.tags.some((t) => t.includes("active-exploitation")));
  const allCves = [...new Set(firewallArticles.flatMap((a) => a.cves))];
  const allActors = [...new Set(firewallArticles.flatMap((a) => a.threatActors).filter(Boolean))];

  // Count articles per vendor
  const vendorCounts = VENDOR_GROUPS.map((group) => {
    const count = firewallArticles.filter((a) => {
      const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.content}`.toLowerCase();
      return group.keywords.some((kw) => text.includes(kw));
    }).length;
    return { ...group, count };
  }).filter((v) => v.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Firewall & Network Edge Intelligence
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Vulnerabilities, CVEs, and threat activity across Fortinet, Palo Alto, Cisco, SonicWall, Ivanti, Juniper, Check Point, and more
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{firewallArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card className="border-threat-critical/20">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{criticalFw.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{allCves.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CVEs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{exploitedFw.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Exploited</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-foreground">{vendorCounts.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vendors</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor breakdown */}
      <div className="flex flex-wrap gap-2 mb-6">
        {vendorCounts.map((v) => (
          <Badge key={v.name} variant="outline" className="text-xs gap-1.5 py-1">
            {v.name}
            <span className="font-mono text-primary">{v.count}</span>
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Critical / Exploited */}
          {criticalFw.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical animate-threat-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-threat-critical">
                  Critical Firewall Threats
                </h2>
              </div>
              <div className="space-y-3">
                {criticalFw.slice(0, 2).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="featured" />
                ))}
                {criticalFw.slice(2).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* All firewall articles */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
              All Firewall & Network Edge Reports ({firewallArticles.length})
            </h2>
            {firewallArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No firewall-related articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {firewallArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* CVEs */}
          {allCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Firewall CVEs ({allCves.length})
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {allCves.slice(0, 15).map((cve) => (
                    <Link key={cve} href={`/cve?q=${cve}`}
                      className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors">
                      <AlertTriangle className="h-3 w-3 text-threat-high" />
                      {cve}
                    </Link>
                  ))}
                  {allCves.length > 15 && (
                    <p className="text-xs text-muted-foreground mt-2">+{allCves.length - 15} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Threat Actors */}
          {allActors.length > 0 && (
            <Card className="border-threat-high/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Actors Targeting Firewalls
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
                {[...new Set(firewallArticles.flatMap((a) => a.affectedProducts))]
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
