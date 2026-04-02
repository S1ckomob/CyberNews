"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import type { ArticleRow } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Shield,
  AlertTriangle,
  Tag,
  Bug,
  Server,
  Users,
  Search,
  SlidersHorizontal,
  X,
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

const FIREWALL_KEYWORDS = [
  "fortinet", "fortigate", "fortios", "fortimanager", "fortianalyzer",
  "fortiproxy", "fortisiem", "fortiswitch", "fortiweb", "fortimail",
  "forticlient", "fortiguard", "fortiap", "fortiadc",
  "palo alto", "pan-os", "panorama", "globalprotect", "prisma",
  "cisco asa", "cisco firepower", "cisco ftd", "meraki mx",
  "sonicwall", "sonicwall sma", "sonicos",
  "check point", "checkpoint", "gaia",
  "juniper srx", "junos", "juniper mx",
  "pfsense", "opnsense", "watchguard", "sophos xg", "sophos firewall",
  "barracuda", "zyxel", "netgate",
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

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

export default function FirewallsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<ThreatLevel[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("articles").select("*").order("published_at", { ascending: false })
      .then(({ data }) => { if (data) setArticles(data.map(rowToArticle)); setLoading(false); });
  }, []);

  const firewallArticles = useMemo(() => articles.filter((a) => {
    const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.tags.join(" ")} ${a.content}`.toLowerCase();
    return FIREWALL_KEYWORDS.some((kw) => text.includes(kw));
  }), [articles]);

  // Filter toggles
  const toggleSeverity = (level: ThreatLevel) => {
    setSeverityFilters((prev) =>
      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
    );
  };
  const toggleVendor = (vendor: string) => {
    setVendorFilter((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  };
  const activeFilterCount = severityFilters.length + vendorFilter.length;
  const clearFilters = () => { setSeverityFilters([]); setVendorFilter([]); setSearch(""); };

  // Apply filters
  const filteredArticles = useMemo(() => {
    let list = firewallArticles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.cves.some((c) => c.toLowerCase().includes(q)) ||
        a.affectedProducts.some((p) => p.toLowerCase().includes(q))
      );
    }
    if (severityFilters.length > 0) {
      list = list.filter((a) => severityFilters.includes(a.threatLevel));
    }
    if (vendorFilter.length > 0) {
      list = list.filter((a) => {
        const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.content}`.toLowerCase();
        return vendorFilter.some((vendorName) => {
          const group = VENDOR_GROUPS.find((g) => g.name === vendorName);
          return group?.keywords.some((kw) => text.includes(kw));
        });
      });
    }
    return list;
  }, [firewallArticles, search, severityFilters, vendorFilter]);

  const criticalFw = useMemo(() => filteredArticles.filter((a) => a.threatLevel === "critical"), [filteredArticles]);
  const exploitedFw = useMemo(() => filteredArticles.filter((a) => a.exploitedAt || a.tags.some((t) => t.includes("active-exploitation"))), [filteredArticles]);
  const allCves = useMemo(() => [...new Set(filteredArticles.flatMap((a) => a.cves))], [filteredArticles]);
  const allActors = useMemo(() => [...new Set(filteredArticles.flatMap((a) => a.threatActors).filter(Boolean))], [filteredArticles]);

  // Count articles per vendor
  const vendorCounts = useMemo(() => VENDOR_GROUPS.map((group) => {
    const count = filteredArticles.filter((a) => {
      const text = `${a.title} ${a.summary} ${a.affectedProducts.join(" ")} ${a.content}`.toLowerCase();
      return group.keywords.some((kw) => text.includes(kw));
    }).length;
    return { ...group, count };
  }).filter((v) => v.count > 0).sort((a, b) => b.count - a.count), [filteredArticles]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Firewall & Network Edge Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
            <div className="text-xl font-mono font-bold text-primary">{filteredArticles.length}</div>
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

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search firewalls, CVEs, vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn("gap-1.5", showFilters && "bg-accent")}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">{activeFilterCount}</Badge>}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Severity</h4>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITY_OPTIONS.map((level) => (
                  <Badge
                    key={level}
                    variant={severityFilters.includes(level) ? "default" : "outline"}
                    className={cn("cursor-pointer capitalize", severityFilters.includes(level) && `bg-threat-${level} hover:bg-threat-${level}/80`)}
                    onClick={() => toggleSeverity(level)}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Vendor</h4>
              <div className="flex flex-wrap gap-1.5">
                {VENDOR_GROUPS.map((group) => (
                  <Badge
                    key={group.name}
                    variant={vendorFilter.includes(group.name) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleVendor(group.name)}
                  >
                    {group.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              All Firewall & Network Edge Reports ({filteredArticles.length})
            </h2>
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No firewall-related articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredArticles.map((a) => (
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
                    <Link key={cve} href={`/cve/${cve}`}
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
                {[...new Set(filteredArticles.flatMap((a) => a.affectedProducts))]
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
