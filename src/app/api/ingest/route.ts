import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

interface CISAVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  shortDescription: string;
  dateAdded: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
}

interface NVDItem {
  cve: {
    id: string;
    descriptions: { lang: string; value: string }[];
    published: string;
    lastModified: string;
    metrics?: {
      cvssMetricV31?: {
        cvssData: { baseScore: number; baseSeverity: string };
      }[];
    };
    configurations?: {
      nodes: {
        cpeMatch: { criteria: string; vulnerable: boolean }[];
      }[];
    }[];
  };
}

function scoreThreatLevel(
  score?: number,
  severity?: string
): "critical" | "high" | "medium" | "low" {
  if (score !== undefined) {
    if (score >= 9.0) return "critical";
    if (score >= 7.0) return "high";
    if (score >= 4.0) return "medium";
    return "low";
  }
  if (severity) {
    const s = severity.toUpperCase();
    if (s === "CRITICAL") return "critical";
    if (s === "HIGH") return "high";
    if (s === "MEDIUM") return "medium";
  }
  return "medium";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

async function fetchCISAKEV(): Promise<
  {
    title: string;
    slug: string;
    summary: string;
    content: string;
    threat_level: "critical" | "high" | "medium" | "low";
    category: string;
    cves: string[];
    affected_products: string[];
    source: string;
    source_url: string;
    published_at: string;
    attack_vector: string;
    verified: boolean;
    verified_by: string[];
    tags: string[];
    region: string;
    industries: string[];
    threat_actors: string[];
  }[]
> {
  const res = await fetch(
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    { next: { revalidate: 0 } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const vulnerabilities: CISAVulnerability[] = data.vulnerabilities || [];

  // Only get entries from the last 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  return vulnerabilities
    .filter((v) => new Date(v.dateAdded) >= cutoff)
    .map((v) => ({
      title: `${v.vendorProject} ${v.product}: ${v.vulnerabilityName}`,
      slug: slugify(`${v.cveID}-${v.vendorProject}-${v.product}`),
      summary: v.shortDescription,
      content: `${v.shortDescription} This vulnerability has been added to CISA's Known Exploited Vulnerabilities catalog with a remediation due date of ${v.dueDate}. ${v.knownRansomwareCampaignUse === "Known" ? "This vulnerability is known to be used in ransomware campaigns." : ""}`,
      threat_level: "high" as const,
      category: "vulnerability",
      cves: [v.cveID],
      affected_products: [`${v.vendorProject} ${v.product}`],
      source: "CISA KEV",
      source_url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
      published_at: new Date(v.dateAdded).toISOString(),
      attack_vector: "Exploitation in the wild confirmed",
      verified: true,
      verified_by: ["CISA"],
      tags: [
        "kev",
        "active-exploitation",
        ...(v.knownRansomwareCampaignUse === "Known"
          ? ["ransomware"]
          : []),
      ],
      region: "Global",
      industries: ["technology", "government"],
      threat_actors: [] as string[],
    }));
}

async function fetchNVDRecent(): Promise<
  {
    title: string;
    slug: string;
    summary: string;
    content: string;
    threat_level: "critical" | "high" | "medium" | "low";
    category: string;
    cves: string[];
    affected_products: string[];
    source: string;
    source_url: string;
    published_at: string;
    attack_vector: string;
    verified: boolean;
    verified_by: string[];
    tags: string[];
    region: string;
    industries: string[];
    threat_actors: string[];
  }[]
> {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    pubStartDate: threeDaysAgo.toISOString().replace("Z", ""),
    pubEndDate: now.toISOString().replace("Z", ""),
    cvssV3Severity: "CRITICAL",
    resultsPerPage: "20",
  });

  const res = await fetch(
    `https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const items: NVDItem[] = data.vulnerabilities?.map(
    (v: { cve: NVDItem["cve"] }) => ({ cve: v.cve })
  ) || [];

  return items.map((item) => {
    const desc =
      item.cve.descriptions.find((d) => d.lang === "en")?.value ||
      "No description available.";
    const metrics = item.cve.metrics?.cvssMetricV31?.[0]?.cvssData;
    const score = metrics?.baseScore;
    const severity = metrics?.baseSeverity;

    const products: string[] = [];
    item.cve.configurations?.forEach((config) => {
      config.nodes.forEach((node) => {
        node.cpeMatch
          .filter((m) => m.vulnerable)
          .forEach((m) => {
            const parts = m.criteria.split(":");
            if (parts.length >= 5) {
              products.push(`${parts[3]} ${parts[4]}`.replace(/_/g, " "));
            }
          });
      });
    });

    return {
      title: `${item.cve.id}: ${desc.slice(0, 100)}${desc.length > 100 ? "..." : ""}`,
      slug: slugify(`${item.cve.id}-${desc.slice(0, 50)}`),
      summary: desc.slice(0, 300),
      content: `${desc}\n\nCVSS Score: ${score ?? "Pending"}${severity ? ` (${severity})` : ""}. Published: ${item.cve.published}. Last modified: ${item.cve.lastModified}.`,
      threat_level: scoreThreatLevel(score, severity),
      category: "vulnerability",
      cves: [item.cve.id],
      affected_products: products.slice(0, 5),
      source: "NIST NVD",
      source_url: `https://nvd.nist.gov/vuln/detail/${item.cve.id}`,
      published_at: item.cve.published,
      attack_vector: "See NVD for details",
      verified: true,
      verified_by: ["NIST"],
      tags: ["nvd", "cve", severity?.toLowerCase() || "pending"].filter(Boolean),
      region: "Global",
      industries: ["technology"],
      threat_actors: [] as string[],
    };
  });
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGEST_API_KEY;
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { cisa: 0, nvd: 0, errors: [] as string[] };

  // Fetch from sources in parallel
  const [cisaArticles, nvdArticles] = await Promise.all([
    fetchCISAKEV().catch((e) => {
      results.errors.push(`CISA: ${e.message}`);
      return [];
    }),
    fetchNVDRecent().catch((e) => {
      results.errors.push(`NVD: ${e.message}`);
      return [];
    }),
  ]);

  const allArticles = [...cisaArticles, ...nvdArticles];

  for (const article of allArticles) {
    // Check if already exists by CVE or slug
    const { data: existing } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", article.slug)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await supabaseAdmin.from("articles").insert({
      ...article,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      results.errors.push(`Insert ${article.cves[0]}: ${error.message}`);
    } else {
      if (article.source === "CISA KEV") results.cisa++;
      else results.nvd++;
    }
  }

  return NextResponse.json({
    success: true,
    ingested: { cisa: results.cisa, nvd: results.nvd },
    total: results.cisa + results.nvd,
    errors: results.errors,
    timestamp: new Date().toISOString(),
  });
}

// Also support GET for easy cron triggering
export async function GET(request: NextRequest) {
  return POST(request);
}
