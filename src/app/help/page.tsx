"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  LayoutDashboard, Sparkles, Clock, Bug, Lock, Shield, Monitor,
  Search, Users, Eye, Bookmark, BarChart3, Bell, Zap, FileDown,
  Keyboard, HelpCircle, ExternalLink, Command,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface HelpItem {
  category: "page" | "feature" | "shortcut" | "source" | "level";
  title: string;
  description: string;
  icon?: LucideIcon;
  href?: string;
  keys?: string[];
  keywords: string; // extra search terms
}

const helpItems: HelpItem[] = [
  // Pages
  { category: "page", title: "Intelligence Feed", description: "All threat intelligence with search, filters by severity/category/industry, and live updates. Full feed with advanced filtering.", icon: LayoutDashboard, href: "/intelligence", keywords: "feed filter search realtime live articles intelligence" },
  { category: "page", title: "Daily Briefing", description: "Executive threat summary with 24h and 3-day windows. Critical threats, zero-days, ransomware, category breakdown, active actors. Export to PDF.", icon: Sparkles, href: "/briefing", keywords: "executive summary report pdf export board leadership" },
  { category: "page", title: "Timeline", description: "Chronological view of all threats grouped by date. Filter by severity. See attack progression over time.", icon: Clock, href: "/timeline", keywords: "chronological date history progression" },
  { category: "page", title: "Zero-Day Tracker", description: "Dedicated tracker for actively exploited zero-day vulnerabilities. Shows affected products, CVEs, and recent activity.", icon: Bug, href: "/zero-days", keywords: "zero day 0day exploited active exploitation" },
  { category: "page", title: "Ransomware Tracker", description: "Active ransomware group profiles, campaign tracking, targeted industries, and most active group leaderboard.", icon: Lock, href: "/ransomware", keywords: "lockbit cl0p blackbasta ransomware groups campaigns victims" },
  { category: "page", title: "Firewalls & Network Edge", description: "Vulnerabilities across Fortinet, Palo Alto, Cisco, SonicWall, Ivanti, Juniper, Check Point, and more.", icon: Shield, href: "/firewalls", keywords: "fortinet fortigate palo alto cisco sonicwall ivanti juniper vpn firewall network edge" },
  { category: "page", title: "Windows Security", description: "Microsoft and Windows vulnerabilities, Patch Tuesday, Active Directory, Exchange, Hyper-V threats.", icon: Monitor, href: "/windows", keywords: "microsoft windows patch tuesday active directory exchange outlook hyper-v ntlm" },
  { category: "page", title: "CVE Search", description: "Search all tracked CVEs. Click any CVE ID for full detail with live CVSS scores, exploitation status, and analysis links.", icon: Search, href: "/cve", keywords: "cve vulnerability search cvss nvd score severity" },
  { category: "page", title: "CVE Detail", description: "Full CVE enrichment page with live NVD data: CVSS score, attack vector, complexity, CWE weakness, references, exploit status, and links to NVD/MITRE/Exploit-DB/Shodan.", icon: Search, href: "/cve/CVE-2026-0015", keywords: "cvss score nist nvd mitre cwe exploit-db shodan analysis enrichment" },
  { category: "page", title: "Threat Actors", description: "Profiles of 16+ tracked threat groups with MITRE ATT&CK tactic grids, TTPs, related articles, origin, and activity timeline.", icon: Users, href: "/threat-actors", keywords: "apt29 apt28 lazarus lockbit salt typhoon volt typhoon sandworm actor group profile mitre" },
  { category: "page", title: "Trends & Analytics", description: "Week-over-week threat trends. Daily volume chart, category shifts, most active actors, top industries, source breakdown.", icon: BarChart3, href: "/trends", keywords: "analytics trends statistics weekly daily chart graph volume" },
  { category: "page", title: "Industries", description: "Threat intelligence filtered by industry: Healthcare, Finance, Government, Energy, Technology, Defense, and more.", icon: LayoutDashboard, href: "/industry", keywords: "healthcare finance government energy defense education manufacturing retail telecom" },
  { category: "page", title: "Watchlist", description: "Add products, threat actors, or CVEs you care about. Matching articles appear automatically. Stored locally.", icon: Eye, href: "/watchlist", keywords: "monitor watch track products vendors alerts personalize" },
  { category: "page", title: "Saved Articles", description: "Articles you've bookmarked. Click Save on any article to add it here. Stored in your browser.", icon: Bookmark, href: "/saved", keywords: "bookmark save later read" },
  { category: "page", title: "Admin Panel", description: "Manage articles, run feed ingestion from 10+ sources, AI-classify raw threat intel with Claude, create articles manually.", icon: LayoutDashboard, href: "/admin", keywords: "admin manage create ingest rss ai classify" },

  // Features
  { category: "feature", title: "Live Threat Ticker", description: "Scrolling banner below the navbar showing the latest threats in real-time. Pauses on hover. Click any item to read the full article.", icon: Zap, keywords: "ticker scrolling banner realtime" },
  { category: "feature", title: "Browser Notifications", description: "Click the bell icon in the navbar to enable desktop alerts. You'll get a notification when a new Critical or Zero-Day is published.", icon: Bell, keywords: "notification alert bell push desktop browser" },
  { category: "feature", title: "Global Search (⌘K)", description: "Press ⌘K (or Ctrl+K) anywhere to search articles, CVEs, and threat actors. Also shows quick navigation to all pages.", icon: Search, keywords: "search command palette keyboard shortcut find" },
  { category: "feature", title: "Save Articles", description: "Click 'Save' on any article detail page to bookmark it. View all saved articles at /saved. Stored in your browser.", icon: Bookmark, keywords: "save bookmark article" },
  { category: "feature", title: "Watchlist Monitoring", description: "Monitor specific products (FortiGate, PAN-OS), threat actors (APT29, LockBit), or CVEs. Matching articles appear automatically.", icon: Eye, keywords: "watchlist monitor track products actors cves" },
  { category: "feature", title: "PDF Export", description: "On the Daily Briefing page, click 'Export PDF' to generate a print-friendly version for leadership or board meetings.", icon: FileDown, keywords: "pdf export print briefing report board" },
  { category: "feature", title: "Source Links", description: "Every article card has a ↗ icon to go directly to the original advisory. Article pages have a prominent 'Read Full Advisory' button.", icon: ExternalLink, keywords: "source link original advisory vendor external" },
  { category: "feature", title: "IOC Panel", description: "Article detail pages auto-extract indicators of compromise (hashes, IPs, domains, CVEs) with links to VirusTotal, AnyRun, Shodan, and more.", icon: Search, keywords: "ioc indicator compromise hash ip domain virustotal anyrun shodan malware analysis" },
  { category: "feature", title: "MITRE ATT&CK Grid", description: "Threat actor pages show a visual 14-tactic kill chain grid. Highlighted cells show observed capabilities from Reconnaissance to Impact.", icon: Shield, keywords: "mitre attack ttp tactic technique kill chain" },
  { category: "feature", title: "Slack Alerts", description: "Set SLACK_WEBHOOK_URL env var to push critical/zero-day threats to your Slack channel automatically on every ingest.", icon: Bell, keywords: "slack webhook alert notification integration" },
  { category: "feature", title: "Daily Email Digest", description: "Subscribe via the newsletter form. Receive a daily email briefing with top threats, grouped by severity, from verified sources.", icon: Zap, keywords: "email newsletter digest subscribe daily briefing" },
  { category: "feature", title: "Theme Toggle", description: "Switch between dark mode, light mode, or system theme. Click the sun/moon icons in the navbar.", icon: Monitor, keywords: "dark light mode theme toggle" },

  // Shortcuts
  { category: "shortcut", title: "⌘K / Ctrl+K", description: "Open global search and command palette from anywhere.", keys: ["⌘", "K"], keywords: "search command palette" },
  { category: "shortcut", title: "Escape", description: "Close the search dialog.", keys: ["Esc"], keywords: "close dismiss" },

  // Sources
  { category: "source", title: "Data Sources", description: "CyberIntel ingests from: CISA KEV, NIST NVD, BleepingComputer, The Hacker News, Krebs on Security, Dark Reading, SecurityWeek, CyberScoop, The Record, Threatpost. Updated every 5 minutes.", keywords: "rss feed source cisa nvd bleeping hacker news krebs dark reading securityweek cyberscoop record threatpost" },

  // Threat levels
  { category: "level", title: "CRITICAL", description: "Active exploitation of critical infrastructure, CVSS 9.0+, mass exploitation, emergency directive issued.", keywords: "critical red severity highest" },
  { category: "level", title: "HIGH", description: "Active exploitation confirmed, CVSS 7.0–8.9, targeted campaigns with significant impact.", keywords: "high orange severity" },
  { category: "level", title: "MEDIUM", description: "Known vulnerability without widespread exploitation, emerging threats, moderate risk.", keywords: "medium yellow severity moderate" },
  { category: "level", title: "LOW", description: "Informational, guidance, law enforcement actions, low-impact advisories.", keywords: "low gray severity informational" },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  page: { label: "Pages", icon: LayoutDashboard },
  feature: { label: "Features", icon: Command },
  shortcut: { label: "Keyboard Shortcuts", icon: Keyboard },
  source: { label: "Data Sources", icon: ExternalLink },
  level: { label: "Threat Levels", icon: Bug },
};

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return helpItems;
    const q = query.toLowerCase();
    return helpItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, HelpItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const categoryOrder = ["page", "feature", "shortcut", "source", "level"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Help & Navigation</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Search for any feature, page, or topic.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="What are you looking for? (e.g. save, CVE, slack, pdf, watchlist, dark mode...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-card text-sm"
          autoFocus
        />
      </div>

      {/* Results count */}
      {query && (
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-semibold">No results found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try different keywords or <button onClick={() => setQuery("")} className="text-primary hover:underline">clear search</button>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped results */}
      <div className="space-y-6">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const config = CATEGORY_LABELS[cat];
          const CatIcon = config.icon;

          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <CatIcon className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider">{config.label}</h2>
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const ItemIcon = item.icon;
                  const content = (
                    <Card className="group transition-all hover:shadow-md hover:border-primary/30">
                      <CardContent className="p-4 flex items-start gap-3">
                        {ItemIcon && <ItemIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                        {item.keys && (
                          <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            {item.keys.map((key) => (
                              <kbd key={key} className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">{key}</kbd>
                            ))}
                          </div>
                        )}
                        {!ItemIcon && !item.keys && item.category === "level" && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono shrink-0 mt-0.5 ${
                              item.title === "CRITICAL" ? "text-threat-critical border-threat-critical/30" :
                              item.title === "HIGH" ? "text-threat-high border-threat-high/30" :
                              item.title === "MEDIUM" ? "text-threat-medium border-threat-medium/30" :
                              "text-threat-low border-threat-low/30"
                            }`}
                          >
                            {item.title}
                          </Badge>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            {item.href && (
                              <code className="text-[10px] text-muted-foreground font-mono">{item.href}</code>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  if (item.href) {
                    return <Link key={item.title} href={item.href}>{content}</Link>;
                  }
                  return <div key={item.title}>{content}</div>;
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
