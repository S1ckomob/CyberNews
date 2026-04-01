"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCommandPalette } from "@/lib/command-palette-context";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Sparkles,
  Bug,
  Lock,
  Shield,
  Monitor,
  Search,
  Users,
  Eye,
  Clock,
  FileText,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResults {
  articles: { title: string; slug: string; threat_level: string; source: string }[];
  actors: { id: string; name: string; origin: string }[];
  cves: { cve: string; articleTitle: string; slug: string }[];
}

const PAGES = [
  { name: "Intelligence Feed", href: "/intelligence", icon: LayoutDashboard },
  { name: "Daily Briefing", href: "/briefing", icon: Sparkles },
  { name: "Zero-Day Tracker", href: "/zero-days", icon: Bug },
  { name: "Ransomware Tracker", href: "/ransomware", icon: Lock },
  { name: "Firewalls & Network Edge", href: "/firewalls", icon: Shield },
  { name: "Windows Security", href: "/windows", icon: Monitor },
  { name: "CVE Search", href: "/cve", icon: Search },
  { name: "Threat Actors", href: "/threat-actors", icon: Users },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Trends & Analytics", href: "/trends", icon: Clock },
  { name: "My Watchlist", href: "/watchlist", icon: Eye },
  { name: "Saved Articles", href: "/saved", icon: FileText },
  { name: "Help & Navigation", href: "/help", icon: AlertTriangle },
  { name: "Admin Panel", href: "/admin", icon: FileText },
];

const THREAT_DOTS: Record<string, string> = {
  critical: "bg-threat-critical",
  high: "bg-threat-high",
  medium: "bg-threat-medium",
  low: "bg-threat-low",
};

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults(null);
      }
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search threats, CVEs, actors, or navigate..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search Results */}
        {results?.articles && results.articles.length > 0 && (
          <CommandGroup heading="Articles">
            {results.articles.map((a) => (
              <CommandItem
                key={a.slug}
                onSelect={() => navigate(`/article/${a.slug}`)}
                className="gap-2"
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", THREAT_DOTS[a.threat_level] || THREAT_DOTS.medium)} />
                <span className="flex-1 truncate">{a.title}</span>
                <span className="text-[10px] text-muted-foreground">{a.source}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.cves && results.cves.length > 0 && (
          <CommandGroup heading="CVEs">
            {results.cves.map((c) => (
              <CommandItem
                key={c.cve}
                onSelect={() => navigate(`/article/${c.slug}`)}
                className="gap-2"
              >
                <AlertTriangle className="h-3 w-3 text-threat-high shrink-0" />
                <span className="font-mono text-xs font-bold">{c.cve}</span>
                <span className="text-xs text-muted-foreground truncate">{c.articleTitle}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.actors && results.actors.length > 0 && (
          <CommandGroup heading="Threat Actors">
            {results.actors.map((a) => (
              <CommandItem
                key={a.id}
                onSelect={() => navigate(`/threat-actors/${a.id}`)}
                className="gap-2"
              >
                <Users className="h-3 w-3 text-threat-high shrink-0" />
                <span className="font-semibold">{a.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-2.5 w-2.5" />{a.origin}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation — always visible */}
        {(!results || (results.articles.length === 0 && results.actors.length === 0 && results.cves.length === 0)) && (
          <>
            {results && <CommandSeparator />}
            <CommandGroup heading="Navigation">
              {PAGES.map((page) => (
                <CommandItem
                  key={page.href}
                  onSelect={() => navigate(page.href)}
                  className="gap-2"
                >
                  <page.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {page.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
