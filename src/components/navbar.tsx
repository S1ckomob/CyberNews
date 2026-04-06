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
  Radar,
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
  Calendar,
  Target,
  BarChart3,
  Bell,
} from "lucide-react";

const primaryNav = [
  { name: "Dashboard", href: "/" },
  { name: "Intelligence", href: "/intelligence" },
  { name: "CVEs", href: "/cve" },
  { name: "Dark Web", href: "/dark-web" },
  { name: "Blogs", href: "/blogs" },
  { name: "Threat Actors", href: "/threat-actors" },
];

const moreNav = [
  // Analysis
  { name: "Executive", href: "/executive", icon: BarChart3 },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  // Tools
  { name: "Threat Map", href: "/map", icon: Globe },
  { name: "Attack Surface", href: "/attack-surface", icon: Target },
  // Personal
  { name: "Watchlist", href: "/watchlist", icon: Eye },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Alerts", href: "/alerts", icon: Bell },
  // Info
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "About", href: "/about", icon: Sparkles },
];

const allNav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Intelligence", href: "/intelligence", icon: Search },
  { name: "CVEs", href: "/cve", icon: Bug },
  { name: "Dark Web", href: "/dark-web", icon: Eye },
  { name: "Blogs", href: "/blogs", icon: Bookmark },
  { name: "Threat Actors", href: "/threat-actors", icon: Users },
  { name: "Executive", href: "/executive", icon: BarChart3 },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Threat Map", href: "/map", icon: Globe },
  { name: "Attack Surface", href: "/attack-surface", icon: Target },
  { name: "Watchlist", href: "/watchlist", icon: Eye },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Alerts", href: "/alerts", icon: Bell },
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl" role="banner">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Radar className="h-5 w-5 text-primary" />
          <span className="text-sm sm:text-base font-bold tracking-tight">Security Intel Hub</span>
        </div>

        {/* Desktop nav — clean text links */}
        <nav aria-label="Primary navigation" className="hidden items-center gap-0.5 lg:flex">
          {primaryNav.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname === item.href || pathname.startsWith(item.href + "/");
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

        {/* Right side — live, controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-1.5 rounded-full bg-threat-critical/10 px-2 py-0.5 text-[10px] font-bold text-threat-critical">
            <span className="h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
            LIVE
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors" aria-label="Open navigation menu">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-0.5">
                {allNav.map((item) => {
                  const isActive = item.href === "/"
                    ? pathname === "/" || pathname === ""
                    : pathname === item.href || pathname.startsWith(item.href + "/");
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
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
