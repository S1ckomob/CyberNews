import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendSlackAlert } from "@/lib/slack";
import { sendPersonalizedAlerts } from "@/lib/alert-matcher";
import { requireApiAuth } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// ---------- Types ----------

interface IngestArticle {
  title: string;
  slug: string;
  summary: string;
  content: string;
  threat_level: "critical" | "high" | "medium" | "low";
  category: string;
  cves: string[];
  affected_products: string[];
  threat_actors: string[];
  industries: string[];
  attack_vector: string;
  source: string;
  source_url: string;
  published_at: string;
  verified: boolean;
  verified_by: string[];
  tags: string[];
  region: string;
}

interface FeedResult {
  source: string;
  count: number;
}

// ---------- Helpers ----------

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function extractCVEs(text: string): string[] {
  const matches = text.match(/CVE-\d{4}-\d{4,}/g) || [];
  return [...new Set(matches)];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function guessThreatLevel(text: string): "critical" | "high" | "medium" | "low" {
  const t = text.toLowerCase();
  if (
    t.includes("critical") ||
    t.includes("actively exploited") ||
    t.includes("emergency") ||
    t.includes("zero-day") ||
    t.includes("mass exploitation")
  )
    return "critical";
  if (
    t.includes("high severity") ||
    t.includes("ransomware") ||
    t.includes("data breach") ||
    t.includes("actively") ||
    t.includes("in the wild")
  )
    return "high";
  if (t.includes("low") || t.includes("informational") || t.includes("advisory"))
    return "low";
  return "medium";
}

function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("ransomware")) return "ransomware";
  if (t.includes("zero-day") || t.includes("0-day")) return "zero-day";
  if (t.includes("data breach") || t.includes("data leak")) return "data-breach";
  if (t.includes("supply chain") || t.includes("supply-chain")) return "supply-chain";
  if (t.includes("apt") || t.includes("state-sponsored") || t.includes("espionage")) return "apt";
  if (t.includes("malware") || t.includes("trojan") || t.includes("botnet")) return "malware";
  if (t.includes("phishing")) return "phishing";
  if (t.includes("ddos")) return "ddos";
  if (t.includes("cve") || t.includes("vulnerability") || t.includes("patch") || t.includes("rce")) return "vulnerability";
  return "vulnerability";
}

const KNOWN_ACTORS = [
  "APT29", "APT28", "Lazarus", "LockBit", "Cl0p", "BlackCat", "ALPHV",
  "Scattered Spider", "Volt Typhoon", "Salt Typhoon", "Sandworm",
  "Black Basta", "Rhysida", "Medusa", "Play", "RansomHub", "Akira",
  "NoName057", "KillNet", "Anonymous Sudan", "UNC3886", "Flax Typhoon",
  "Turla", "Kimsuky", "Charming Kitten", "MuddyWater",
];

function extractActors(text: string): string[] {
  return KNOWN_ACTORS.filter((actor) =>
    text.toLowerCase().includes(actor.toLowerCase())
  );
}

// ---------- RSS Feed Fetcher ----------

interface RSSFeedConfig {
  url: string;
  source: string;
  maxItems: number;
}

const NITTER_BASE = "https://nitter.net";

const RSS_FEEDS: RSSFeedConfig[] = [
  // News sites
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer", maxItems: 15 },
  { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News", maxItems: 15 },
  { url: "https://krebsonsecurity.com/feed/", source: "Krebs on Security", maxItems: 10 },
  { url: "https://www.darkreading.com/rss.xml", source: "Dark Reading", maxItems: 15 },
  { url: "https://www.securityweek.com/feed/", source: "SecurityWeek", maxItems: 15 },
  { url: "https://cyberscoop.com/feed/", source: "CyberScoop", maxItems: 10 },
  { url: "https://therecord.media/feed", source: "The Record", maxItems: 15 },
  { url: "https://threatpost.com/feed/", source: "Threatpost", maxItems: 10 },

  // Twitter/X via Nitter — government & official
  { url: `${NITTER_BASE}/CISAgov/rss`, source: "CISA (X)", maxItems: 10 },
  { url: `${NITTER_BASE}/NSACyber/rss`, source: "NSA Cyber (X)", maxItems: 8 },
  { url: `${NITTER_BASE}/FBI/rss`, source: "FBI (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/ABORODULIN/rss`, source: "NCSC UK (X)", maxItems: 5 },

  // Twitter/X via Nitter — vendors & threat intel
  { url: `${NITTER_BASE}/MsftSecIntel/rss`, source: "Microsoft Threat Intel (X)", maxItems: 8 },
  { url: `${NITTER_BASE}/GoogleTAG/rss`, source: "Google TAG (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/Mandiant/rss`, source: "Mandiant (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/CrowdStrike/rss`, source: "CrowdStrike (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/SentinelOne/rss`, source: "SentinelOne (X)", maxItems: 5 },

  // Twitter/X via Nitter — security researchers
  { url: `${NITTER_BASE}/GossiTheDog/rss`, source: "Kevin Beaumont (X)", maxItems: 8 },
  { url: `${NITTER_BASE}/malaborodulin/rss`, source: "MalwareTech (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/TheDFIRReport/rss`, source: "DFIR Report (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/vaborodulin/rss`, source: "vx-underground (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/BillDemirkapi/rss`, source: "Bill Demirkapi (X)", maxItems: 5 },
  { url: `${NITTER_BASE}/campuscodi/rss`, source: "Catalin Cimpanu (X)", maxItems: 8 },
  { url: `${NITTER_BASE}/H4ckManac/rss`, source: "HackManac (X)", maxItems: 8 },
];

async function fetchRSSFeed(config: RSSFeedConfig): Promise<IngestArticle[]> {
  const res = await fetch(config.url, {
    headers: { "User-Agent": "SecurityStandard/1.0 (RSS Aggregator)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const parsed = xmlParser.parse(xml);

  // Handle both RSS 2.0 and Atom feeds
  let items: unknown[] = [];
  if (parsed.rss?.channel?.item) {
    items = Array.isArray(parsed.rss.channel.item)
      ? parsed.rss.channel.item
      : [parsed.rss.channel.item];
  } else if (parsed.feed?.entry) {
    items = Array.isArray(parsed.feed.entry)
      ? parsed.feed.entry
      : [parsed.feed.entry];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3); // Last 3 days only

  return items
    .slice(0, config.maxItems)
    .map((item: unknown) => {
      const entry = item as Record<string, unknown>;

      // Extract fields (RSS vs Atom)
      const title = String(entry.title || "").trim();
      const link =
        typeof entry.link === "string"
          ? entry.link
          : typeof entry.link === "object" && entry.link !== null
            ? String((entry.link as Record<string, unknown>)["@_href"] || "")
            : "";
      const description = stripHtml(
        String(entry.description || entry["content:encoded"] || entry.content || entry.summary || "")
      );
      const pubDate = String(entry.pubDate || entry.published || entry.updated || "");
      const categories: string[] = [];
      if (entry.category) {
        const cats = Array.isArray(entry.category) ? entry.category : [entry.category];
        cats.forEach((c: unknown) => {
          if (typeof c === "string") categories.push(c);
          else if (typeof c === "object" && c !== null) {
            const catObj = c as Record<string, unknown>;
            categories.push(String(catObj["#text"] || catObj["@_term"] || ""));
          }
        });
      }

      if (!title) return null;

      // For Twitter/Nitter feeds: title is often the full tweet, description has HTML
      const isTwitter = config.source.includes("(X)");
      let displayTitle = title;
      if (isTwitter) {
        // Skip retweets, replies, and non-security content
        if (title.startsWith("RT @") || title.startsWith("@")) return null;
        // Skip short tweets with no substance (< 50 chars)
        if (title.length < 50 && !title.match(/CVE-|zero.?day|critical|exploit|breach|ransomware|malware|vuln/i)) return null;
        // Use truncated tweet as title if it's too long
        if (title.length > 120) {
          const firstSentence = title.split(/[.!]\s/)[0];
          if (firstSentence && firstSentence.length >= 30 && firstSentence.length <= 150) {
            displayTitle = firstSentence;
          } else {
            displayTitle = title.slice(0, 117) + "...";
          }
        }
      }

      // Skip non-threat content (events, opinions, podcasts, webinars, career)
      const titleLower = displayTitle.toLowerCase();
      const skipPatterns = [
        "black hat", "def con", "rsa conference", "webinar", "podcast",
        "career", "hiring", "job opening", "opinion:", "editorial:",
        "book review", "sponsored", "advertisement", "register now",
        "call for papers", "cfp", "save the date", "conference recap",
        "award", "winner", "top 10 list", "infographic",
      ];
      if (skipPatterns.some((p) => titleLower.includes(p))) return null;

      const publishedDate = pubDate ? new Date(pubDate) : new Date();
      if (publishedDate < cutoff) return null;

      const fullText = `${title} ${description} ${categories.join(" ")}`;
      const cves = extractCVEs(fullText);
      const actors = extractActors(fullText);

      return {
        title: displayTitle,
        slug: slugify(displayTitle),
        summary: (isTwitter ? title : description).slice(0, 400),
        content: isTwitter ? title : description,
        threat_level: guessThreatLevel(fullText),
        category: guessCategory(fullText),
        cves,
        affected_products: [] as string[],
        threat_actors: actors,
        industries: ["technology"] as string[],
        attack_vector: cves.length > 0 ? "Vulnerability Exploitation" : "See source for details",
        source: config.source,
        source_url: link,
        published_at: publishedDate.toISOString(),
        verified: false,
        verified_by: [] as string[],
        tags: [
          ...categories
            .map((c) => c.toLowerCase().replace(/\s+/g, "-"))
            .filter((c) => c.length > 0 && c.length < 30)
            .slice(0, 5),
          ...(cves.length > 0 ? ["cve"] : []),
          ...(actors.length > 0 ? ["threat-actor"] : []),
        ],
        region: "Global",
      } satisfies IngestArticle;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null) as IngestArticle[];
}

// ---------- CISA KEV ----------

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

async function fetchCISAKEV(): Promise<IngestArticle[]> {
  const res = await fetch(
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    { next: { revalidate: 0 } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const vulnerabilities: CISAVulnerability[] = data.vulnerabilities || [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  return vulnerabilities
    .filter((v) => new Date(v.dateAdded) >= cutoff)
    .map((v) => ({
      title: `CISA KEV: ${v.vendorProject} ${v.product} — ${v.vulnerabilityName}`,
      slug: slugify(`cisa-kev-${v.cveID}-${v.vendorProject}-${v.product}`),
      summary: v.shortDescription,
      content: `${v.shortDescription}\n\nAdded to CISA Known Exploited Vulnerabilities catalog on ${v.dateAdded}. Remediation due: ${v.dueDate}. ${v.knownRansomwareCampaignUse === "Known" ? "Known to be used in ransomware campaigns." : ""}`,
      threat_level: "high" as const,
      category: "vulnerability",
      cves: [v.cveID],
      affected_products: [`${v.vendorProject} ${v.product}`],
      threat_actors: [] as string[],
      industries: ["technology", "government"] as string[],
      attack_vector: "Active exploitation confirmed",
      source: "CISA KEV",
      source_url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
      published_at: new Date(v.dateAdded).toISOString(),
      verified: true,
      verified_by: ["CISA"],
      tags: ["kev", "active-exploitation", ...(v.knownRansomwareCampaignUse === "Known" ? ["ransomware"] : [])],
      region: "Global",
    }));
}

// ---------- NVD Critical CVEs ----------

async function fetchNVDRecent(): Promise<IngestArticle[]> {
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
  interface NVDVuln {
    cve: {
      id: string;
      descriptions: { lang: string; value: string }[];
      published: string;
      lastModified: string;
      metrics?: {
        cvssMetricV31?: { cvssData: { baseScore: number; baseSeverity: string } }[];
      };
    };
  }

  const items: NVDVuln[] = data.vulnerabilities || [];

  return items.map((item) => {
    const desc =
      item.cve.descriptions.find((d) => d.lang === "en")?.value || "No description available.";
    const score = item.cve.metrics?.cvssMetricV31?.[0]?.cvssData.baseScore;

    return {
      title: `NVD Critical: ${item.cve.id} — ${desc.slice(0, 80)}${desc.length > 80 ? "..." : ""}`,
      slug: slugify(`nvd-${item.cve.id}`),
      summary: desc.slice(0, 400),
      content: `${desc}\n\nCVSS Score: ${score ?? "Pending"}. Published: ${item.cve.published}.`,
      threat_level: "critical" as const,
      category: "vulnerability",
      cves: [item.cve.id],
      affected_products: [] as string[],
      threat_actors: extractActors(desc),
      industries: ["technology"] as string[],
      attack_vector: "See NVD for details",
      source: "NIST NVD",
      source_url: `https://nvd.nist.gov/vuln/detail/${item.cve.id}`,
      published_at: item.cve.published,
      verified: true,
      verified_by: ["NIST"],
      tags: ["nvd", "cve", "critical"],
      region: "Global",
    };
  });
}

// ---------- Main Handler ----------

export async function POST(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "heavy");
  if (rateLimitError) return rateLimitError;

  // Auth: require Bearer token or Vercel CRON_SECRET
  const authError = requireApiAuth(request);
  if (authError) return authError;

  const results: Record<string, number> = {};
  const errors: string[] = [];

  // Fetch from all sources in parallel
  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const articles = await fetchRSSFeed(feed);
      return { source: feed.source, articles };
    } catch (e) {
      errors.push(`${feed.source}: ${(e as Error).message}`);
      return { source: feed.source, articles: [] };
    }
  });

  const [cisaArticles, nvdArticles, ...feedResults] = await Promise.all([
    fetchCISAKEV().catch((e) => {
      errors.push(`CISA: ${e.message}`);
      return [];
    }),
    fetchNVDRecent().catch((e) => {
      errors.push(`NVD: ${e.message}`);
      return [];
    }),
    ...feedPromises,
  ]);

  // Combine all articles
  const allArticles: { source: string; article: IngestArticle }[] = [
    ...cisaArticles.map((a) => ({ source: "CISA KEV", article: a })),
    ...nvdArticles.map((a) => ({ source: "NIST NVD", article: a })),
    ...feedResults.flatMap((r) =>
      r.articles.map((a: IngestArticle) => ({ source: r.source, article: a }))
    ),
  ];

  // Insert with deduplication
  let totalInserted = 0;
  const newlyInserted: IngestArticle[] = [];
  for (const { source, article } of allArticles) {
    const { data: existing } = await getSupabaseAdmin()
      .from("articles")
      .select("id")
      .eq("slug", article.slug)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await getSupabaseAdmin().from("articles").insert({
      ...article,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      errors.push(`Insert [${source}] ${article.title.slice(0, 50)}: ${error.message}`);
    } else {
      results[source] = (results[source] || 0) + 1;
      totalInserted++;
      newlyInserted.push(article);
    }
  }

  // Send alerts for new articles
  if (newlyInserted.length > 0) {
    await Promise.all([
      sendSlackAlert(newlyInserted).catch(() => {}),
      sendPersonalizedAlerts(newlyInserted).catch(() => {}),
    ]);
  }

  logAudit(request, "ingest.run", { total: totalInserted, sources_checked: RSS_FEEDS.length + 2 });

  return NextResponse.json({
    success: true,
    ingested: results,
    total: totalInserted,
    sources_checked: RSS_FEEDS.length + 2,
    errors: errors.slice(0, 20),
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
