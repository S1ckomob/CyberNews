export const revalidate = 60;

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThreatBadge } from "@/components/threat-badge";
import { ArticleCard } from "@/components/article-card";
import { fetchArticles } from "@/lib/queries";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Shield,
  ExternalLink,
  Tag,
  Activity,
  Target,
  Clock,
  Flame,
  ChevronRight,
  Code,
  CheckCircle,
  XCircle,
  Wrench,
} from "lucide-react";

interface NVDData {
  id: string;
  description: string;
  published: string;
  lastModified: string;
  cvssScore: number | null;
  cvssVector: string | null;
  baseSeverity: string | null;
  attackVector: string | null;
  attackComplexity: string | null;
  privilegesRequired: string | null;
  userInteraction: string | null;
  scope: string | null;
  confidentialityImpact: string | null;
  integrityImpact: string | null;
  availabilityImpact: string | null;
  cweIds: string[];
  references: { url: string; source: string; tags: string[] }[];
}

async function fetchNVDData(cveId: string): Promise<NVDData | null> {
  try {
    const res = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`,
      { next: { revalidate: 3600 } } // cache 1 hour
    );
    if (!res.ok) return null;
    const data = await res.json();
    const vuln = data.vulnerabilities?.[0]?.cve;
    if (!vuln) return null;

    const metrics =
      vuln.metrics?.cvssMetricV31?.[0]?.cvssData ||
      vuln.metrics?.cvssMetricV30?.[0]?.cvssData ||
      null;

    const weaknesses = vuln.weaknesses?.flatMap(
      (w: { description: { value: string }[] }) =>
        w.description.map((d: { value: string }) => d.value)
    ) || [];

    const refs = vuln.references?.map(
      (r: { url: string; source: string; tags: string[] }) => ({
        url: r.url,
        source: r.source || "",
        tags: r.tags || [],
      })
    ) || [];

    return {
      id: vuln.id,
      description:
        vuln.descriptions?.find((d: { lang: string }) => d.lang === "en")?.value || "",
      published: vuln.published,
      lastModified: vuln.lastModified,
      cvssScore: metrics?.baseScore ?? null,
      cvssVector: metrics?.vectorString ?? null,
      baseSeverity: metrics?.baseSeverity ?? null,
      attackVector: metrics?.attackVector ?? null,
      attackComplexity: metrics?.attackComplexity ?? null,
      privilegesRequired: metrics?.privilegesRequired ?? null,
      userInteraction: metrics?.userInteraction ?? null,
      scope: metrics?.scope ?? null,
      confidentialityImpact: metrics?.confidentialityImpact ?? null,
      integrityImpact: metrics?.integrityImpact ?? null,
      availabilityImpact: metrics?.availabilityImpact ?? null,
      cweIds: weaknesses.filter((w: string) => w.startsWith("CWE-")),
      references: refs,
    };
  } catch {
    return null;
  }
}

async function fetchGitHubPoCCount(cveId: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${cveId}&per_page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.total_count || 0;
  } catch {
    return 0;
  }
}

function derivePatchStatus(nvd: NVDData | null, articles: { patchedAt?: string }[]): "patched" | "workaround" | "unpatched" {
  if (articles.some((a) => a.patchedAt)) return "patched";
  if (nvd?.references.some((r) => r.tags.includes("Patch") || r.tags.includes("Vendor Advisory"))) return "patched";
  if (nvd?.references.some((r) => r.tags.includes("Mitigation") || r.tags.includes("Workaround"))) return "workaround";
  return "unpatched";
}

function severityColor(severity: string | null): string {
  switch (severity?.toUpperCase()) {
    case "CRITICAL": return "text-threat-critical";
    case "HIGH": return "text-threat-high";
    case "MEDIUM": return "text-threat-medium";
    case "LOW": return "text-threat-low";
    default: return "text-muted-foreground";
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 9.0) return "text-threat-critical";
  if (score >= 7.0) return "text-threat-high";
  if (score >= 4.0) return "text-threat-medium";
  return "text-threat-low";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${id.toUpperCase()} — CVE Detail`,
    description: `Vulnerability details, CVSS scoring, and related threat intelligence for ${id.toUpperCase()}.`,
  };
}

export default async function CVEDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cveId = id.toUpperCase();

  const [nvdData, articles, pocCount] = await Promise.all([
    fetchNVDData(cveId),
    fetchArticles(),
    fetchGitHubPoCCount(cveId),
  ]);

  const relatedArticles = articles.filter((a) =>
    a.cves.some((c) => c.toUpperCase() === cveId)
  );

  const exploited = relatedArticles.some((a) => a.exploitedAt);
  const patchStatus = derivePatchStatus(nvdData, relatedArticles);
  const affectedProducts = [...new Set(relatedArticles.flatMap((a) => a.affectedProducts))];
  const linkedActors = [...new Set(relatedArticles.flatMap((a) => a.threatActors).filter(Boolean))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/cve" className="hover:text-foreground transition-colors">CVEs</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-mono">{cveId}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-mono tracking-tight">{cveId}</h1>
            {nvdData?.baseSeverity && (
              <Badge variant="outline" className={`text-xs font-bold ${severityColor(nvdData.baseSeverity)}`}>
                {nvdData.baseSeverity}
              </Badge>
            )}
            {exploited && (
              <Badge variant="outline" className="text-xs text-threat-critical border-threat-critical/30 gap-1">
                <Flame className="h-3 w-3" /> Exploited in Wild
              </Badge>
            )}
          </div>
          {nvdData && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {nvdData.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* CVSS Score Card */}
          {nvdData?.cvssScore !== null && nvdData?.cvssScore !== undefined && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">CVSS v3.1 Score</h2>
                </div>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <div className={`text-4xl font-mono font-bold ${scoreColor(nvdData.cvssScore)}`}>
                      {nvdData.cvssScore.toFixed(1)}
                    </div>
                    <div className={`text-xs font-bold uppercase ${severityColor(nvdData.baseSeverity)}`}>
                      {nvdData.baseSeverity}
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(nvdData.cvssScore / 10) * 100}%`,
                          backgroundColor: nvdData.cvssScore >= 9 ? "var(--threat-critical)" : nvdData.cvssScore >= 7 ? "var(--threat-high)" : nvdData.cvssScore >= 4 ? "var(--threat-medium)" : "var(--threat-low)",
                        }}
                      />
                    </div>
                    {nvdData.cvssVector && (
                      <code className="text-[10px] text-muted-foreground mt-1 block font-mono">
                        {nvdData.cvssVector}
                      </code>
                    )}
                  </div>
                </div>

                {/* CVSS Breakdown */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Attack Vector", value: nvdData.attackVector },
                    { label: "Complexity", value: nvdData.attackComplexity },
                    { label: "Privileges", value: nvdData.privilegesRequired },
                    { label: "User Interaction", value: nvdData.userInteraction },
                    { label: "Scope", value: nvdData.scope },
                    { label: "Confidentiality", value: nvdData.confidentialityImpact },
                    { label: "Integrity", value: nvdData.integrityImpact },
                    { label: "Availability", value: nvdData.availabilityImpact },
                  ].filter((m) => m.value).map((metric) => (
                    <div key={metric.label} className="rounded bg-muted/50 p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.label}</div>
                      <div className="text-xs font-semibold mt-0.5">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!nvdData && (
            <Card>
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-threat-medium" />
                NVD data not available for this CVE. It may be pending analysis or not yet published.
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          {nvdData && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Published: {new Date(nvdData.published).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Modified: {new Date(nvdData.lastModified).toLocaleDateString()}
              </span>
            </div>
          )}

          <Separator />

          {/* Related Articles */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
              Related Intelligence ({relatedArticles.length})
            </h2>
            {relatedArticles.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No articles currently reference this CVE.
              </p>
            )}
          </div>

          {/* References */}
          {nvdData && nvdData.references.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
                References ({nvdData.references.length})
              </h2>
              <div className="space-y-1.5">
                {nvdData.references.map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded bg-muted/50 px-3 py-2 text-xs hover:bg-accent transition-colors group"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                    <span className="flex-1 truncate text-foreground">{ref.url}</span>
                    {ref.tags.length > 0 && (
                      <span className="flex gap-1 shrink-0">
                        {ref.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                        ))}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* External Links */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                Analyze
              </h3>
              <div className="space-y-1.5">
                {[
                  { name: "NVD", url: `https://nvd.nist.gov/vuln/detail/${cveId}` },
                  { name: "MITRE CVE", url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveId}` },
                  { name: "CISA KEV", url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog` },
                  { name: "Exploit-DB", url: `https://www.exploit-db.com/search?cve=${cveId.replace("CVE-", "")}` },
                  { name: "GitHub PoCs", url: `https://github.com/search?q=${cveId}&type=repositories` },
                ].map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded bg-muted/50 px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CWEs */}
          {nvdData && nvdData.cweIds.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Weakness Type
                </h3>
                <div className="space-y-1.5">
                  {nvdData.cweIds.map((cwe) => (
                    <a
                      key={cwe}
                      href={`https://cwe.mitre.org/data/definitions/${cwe.replace("CWE-", "")}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded bg-muted/50 px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                    >
                      <Tag className="h-3 w-3 text-primary" />
                      {cwe}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Products */}
          {affectedProducts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Affected Products
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {affectedProducts.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Threat Actors */}
          {linkedActors.length > 0 && (
            <Card className="border-threat-high/20">
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Threat Actors Exploiting
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {linkedActors.map((a) => (
                    <Badge key={a} variant="outline" className="text-xs font-semibold">{a}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exploitation & Patch Status */}
          <Card className={exploited ? "border-threat-critical/30 bg-threat-critical/5" : ""}>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
                  Exploitation
                </h3>
                <div className={`flex items-center gap-2 text-sm font-semibold ${exploited ? "text-threat-critical" : "text-muted-foreground"}`}>
                  {exploited ? (
                    <><Flame className="h-4 w-4" /> Exploited in the Wild</>
                  ) : (
                    <><Shield className="h-4 w-4" /> No Known Exploitation</>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
                  Patch Status
                </h3>
                <div className={`flex items-center gap-2 text-sm font-semibold ${
                  patchStatus === "patched" ? "text-primary" :
                  patchStatus === "workaround" ? "text-threat-medium" :
                  "text-threat-critical"
                }`}>
                  {patchStatus === "patched" ? (
                    <><CheckCircle className="h-4 w-4" /> Patch Available</>
                  ) : patchStatus === "workaround" ? (
                    <><Wrench className="h-4 w-4" /> Workaround Only</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> No Patch Available</>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
                  Public Exploits
                </h3>
                <div className={`flex items-center gap-2 text-sm font-semibold ${pocCount > 0 ? "text-threat-high" : "text-muted-foreground"}`}>
                  <Code className="h-4 w-4" />
                  {pocCount > 0 ? (
                    <a href={`https://github.com/search?q=${cveId}&type=repositories`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {pocCount} PoC{pocCount !== 1 ? "s" : ""} on GitHub
                    </a>
                  ) : (
                    "No public PoCs found"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
