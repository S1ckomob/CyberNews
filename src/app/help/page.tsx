import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  LayoutDashboard, Sparkles, Clock, Bug, Lock, Shield, Monitor,
  Search, Users, Eye, Bookmark, BarChart3, Bell, Zap, FileDown,
  Keyboard, HelpCircle, ExternalLink, Command,
} from "lucide-react";

export const metadata = {
  title: "Help & Navigation Guide",
  description: "Learn how to use CyberIntel — features, keyboard shortcuts, and page guide.",
};

const pages = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Real-time intelligence feed with search, filters by severity/category/industry, and live updates via Supabase. Your main command center." },
  { name: "Daily Briefing", href: "/briefing", icon: Sparkles, description: "Executive threat summary with 24-hour and 3-day windows. Shows critical threats, zero-days, ransomware activity, category breakdown, and active threat actors. Export to PDF for leadership." },
  { name: "Timeline", href: "/timeline", icon: Clock, description: "Chronological view of all threats grouped by date. Filter by severity. See attack progression over time." },
  { name: "Zero-Day Tracker", href: "/zero-days", icon: Bug, description: "Dedicated tracker for actively exploited zero-day vulnerabilities. Shows affected products, CVEs, and recent activity." },
  { name: "Ransomware Tracker", href: "/ransomware", icon: Lock, description: "Active ransomware group profiles, campaign tracking, targeted industries, and most active group leaderboard." },
  { name: "Firewalls & Network Edge", href: "/firewalls", icon: Shield, description: "Vulnerabilities across Fortinet, Palo Alto, Cisco, SonicWall, Ivanti, Juniper, Check Point, and more. Vendor breakdown with article counts." },
  { name: "Windows Security", href: "/windows", icon: Monitor, description: "Microsoft and Windows vulnerabilities, Patch Tuesday coverage, Active Directory, Exchange, and Hyper-V threats." },
  { name: "CVE Search", href: "/cve", icon: Search, description: "Search all tracked CVEs. Click any CVE ID for a full detail page with live CVSS scores from NVD, exploitation status, and analysis tool links." },
  { name: "Threat Actors", href: "/threat-actors", icon: Users, description: "Profiles of 16+ tracked threat groups with MITRE ATT&CK tactic grids, TTPs, related articles, origin, and activity timeline." },
  { name: "Trends & Analytics", href: "/trends", icon: BarChart3, description: "Week-over-week threat trends. Daily volume chart, category shifts, most active actors, top industries, and source breakdown." },
  { name: "Watchlist", href: "/watchlist", icon: Eye, description: "Add products, threat actors, or CVEs you care about. Matching articles appear automatically. Stored locally — no account needed." },
  { name: "Saved Articles", href: "/saved", icon: Bookmark, description: "Articles you've bookmarked. Click Save on any article to add it here. Stored in your browser." },
];

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open search / command palette" },
  { keys: ["Esc"], description: "Close search" },
];

const features = [
  { icon: Zap, name: "Live Threat Ticker", description: "Scrolling banner below the navbar showing the latest threats in real-time. Pauses on hover. Click any item to read the full article." },
  { icon: Bell, name: "Browser Notifications", description: "Click the bell icon in the navbar to enable desktop alerts. You'll get a notification when a new Critical or Zero-Day threat is published." },
  { icon: Search, name: "Global Search (⌘K)", description: "Press ⌘K (or Ctrl+K) anywhere to search articles, CVEs, and threat actors. Also shows quick navigation links to all pages." },
  { icon: Bookmark, name: "Save Articles", description: "Click 'Save' on any article detail page to bookmark it. View all saved articles at /saved. Stored in your browser — no account required." },
  { icon: Eye, name: "Watchlist", description: "Monitor specific products (FortiGate, PAN-OS), threat actors (APT29, LockBit), or CVEs. Add items and every matching article appears automatically." },
  { icon: FileDown, name: "PDF Export", description: "On the Daily Briefing page, click 'Export PDF' to generate a print-friendly version for leadership or board meetings." },
  { icon: ExternalLink, name: "Source Links", description: "Every article card has a ↗ icon to go directly to the original source. Article detail pages have a prominent 'Read Full Advisory' button." },
  { icon: Search, name: "IOC Panel", description: "Article detail pages automatically extract indicators of compromise (hashes, IPs, domains, CVEs) with one-click links to VirusTotal, AnyRun, Shodan, and more." },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Help & Navigation</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Everything you need to know to get the most out of CyberIntel.
      </p>

      {/* Quick Nav */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jump to</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Shortcuts", href: "#shortcuts" },
              { label: "Features", href: "#features" },
              { label: "All Pages", href: "#pages" },
              { label: "Data Sources", href: "#sources" },
              { label: "Threat Levels", href: "#threat-levels" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <section id="shortcuts" className="mb-8 scroll-mt-20">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Keyboard Shortcuts</h2>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.description} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((key) => (
                      <kbd key={key} className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section id="features" className="mb-8 scroll-mt-20">
        <div className="flex items-center gap-2 mb-4">
          <Command className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Features</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <f.icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{f.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Page Directory */}
      <section id="pages" className="mb-8 scroll-mt-20">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">All Pages</h2>
        <div className="space-y-2">
          {pages.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="group transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <page.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {page.name}
                      </h3>
                      <code className="text-[10px] text-muted-foreground font-mono">{page.href}</code>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {page.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section id="sources" className="mb-8 scroll-mt-20">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Data Sources</h2>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              CyberIntel ingests threat intelligence from 10+ sources every 5 minutes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "CISA KEV", "NIST NVD", "BleepingComputer", "The Hacker News",
                "Krebs on Security", "Dark Reading", "SecurityWeek",
                "CyberScoop", "The Record", "Threatpost",
              ].map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Threat Levels */}
      <section id="threat-levels" className="scroll-mt-20">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Threat Levels</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            {[
              { level: "CRITICAL", color: "text-threat-critical", desc: "Active exploitation of critical infrastructure, CVSS 9.0+, mass exploitation, emergency directive issued." },
              { level: "HIGH", color: "text-threat-high", desc: "Active exploitation confirmed, CVSS 7.0–8.9, targeted campaigns with significant impact." },
              { level: "MEDIUM", color: "text-threat-medium", desc: "Known vulnerability without widespread exploitation, emerging threats, moderate risk." },
              { level: "LOW", color: "text-threat-low", desc: "Informational, guidance, law enforcement actions, low-impact advisories." },
            ].map((t) => (
              <div key={t.level} className="flex items-start gap-3">
                <Badge variant="outline" className={`${t.color} border-current/30 font-mono text-[10px] shrink-0 mt-0.5`}>
                  {t.level}
                </Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
