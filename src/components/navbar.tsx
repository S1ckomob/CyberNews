"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationManager } from "@/components/notification-manager";
import { useCommandPalette } from "@/lib/command-palette-context";
import {
  Shield,
  Search,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
  Clock,
  Bug,
  Lock,
  Monitor,
  Eye,
  Users,
  Building2,
  Bookmark,
  TrendingUp,
  HelpCircle,
  Globe,
} from "lucide-react";

const primaryNav = [
  { name: "Intelligence", href: "/intelligence" },
  { name: "Briefing", href: "/briefing" },
  { name: "Zero-Days", href: "/zero-days" },
  { name: "CVEs", href: "/cve" },
];

const moreNav = [
  { name: "Threat Map", href: "/map", icon: Globe },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Ransomware", href: "/ransomware", icon: Lock },
  { name: "Firewalls", href: "/firewalls", icon: Shield },
  { name: "Windows", href: "/windows", icon: Monitor },
  { name: "Threat Actors", href: "/threat-actors", icon: Users },
  { name: "Industries", href: "/industry", icon: Building2 },
  { name: "Watchlist", href: "/watchlist", icon: Eye },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "API Docs", href: "/api-docs", icon: Clock },
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "About", href: "/about", icon: Sparkles },
];

const allNav = [
  { name: "Intelligence", href: "/intelligence", icon: LayoutDashboard },
  { name: "Briefing", href: "/briefing", icon: Sparkles },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Zero-Days", href: "/zero-days", icon: Bug },
  { name: "Ransomware", href: "/ransomware", icon: Lock },
  { name: "Firewalls", href: "/firewalls", icon: Shield },
  { name: "Windows", href: "/windows", icon: Monitor },
  { name: "CVEs", href: "/cve", icon: Search },
  { name: "Threat Actors", href: "/threat-actors", icon: Users },
  { name: "Industries", href: "/industry", icon: Building2 },
  { name: "Watchlist", href: "/watchlist", icon: Eye },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Threat Map", href: "/map", icon: Globe },
  { name: "API Docs", href: "/api-docs", icon: Clock },
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "About", href: "/about", icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { setOpen: setCommandOpen } = useCommandPalette();

  const isMoreActive = moreNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">CyberIntel</span>
        </Link>

        {/* Desktop nav — clean text links */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {primaryNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
              </Link>
            );
          })}

          {/* More dropdown */}
          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
                isMoreActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              More
              <ChevronDown className="h-3 w-3" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1">
              {moreNav.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </PopoverContent>
          </Popover>
        </nav>

        {/* Right side — search, live, controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search className="h-3 w-3" />
            <span className="hidden xl:inline">Search</span>
            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-threat-critical/10 px-2 py-0.5 text-[10px] font-bold text-threat-critical">
            <span className="h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
            LIVE
          </div>
          <NotificationManager />
          <ThemeToggle />
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setCommandOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="mt-6 flex flex-col gap-0.5">
                {allNav.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="mt-4 px-3 flex items-center gap-2">
                  <ThemeToggle />
                  <NotificationManager />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
