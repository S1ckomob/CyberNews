import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { ThreatTicker } from "@/components/threat-ticker";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPaletteProvider } from "@/lib/command-palette-context";
import { CommandPalette } from "@/components/command-palette";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cyber-news-five.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Security Intel Hub | Institutional Cybersecurity Intelligence",
    template: "%s | Security Intel Hub",
  },
  description:
    "The institutional standard for cybersecurity intelligence. Real-time threat data, verified sources, and actionable intelligence for security teams.",
  keywords: [
    "cybersecurity", "threat intelligence", "CVE", "vulnerability", "security",
    "CISO", "threat actors", "ransomware", "APT", "zero-day", "malware",
    "incident response", "MITRE ATT&CK", "CVSS", "NVD", "CISA",
    "SOC", "security operations", "cyber threat", "exploit",
  ],
  authors: [{ name: "Security Intel Hub", url: siteUrl }],
  creator: "Security Intel Hub",
  publisher: "Security Intel Hub",
  formatDetection: { telephone: false, email: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Security Intel Hub",
    title: "Security Intel Hub | Institutional Cybersecurity Intelligence",
    description: "Real-time threat data. Verified sources. Actionable intelligence.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Intel Hub",
    description: "The institutional standard for cybersecurity intelligence.",
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
        <CommandPaletteProvider>
        <TooltipProvider>
          <CommandPalette />
          <Navbar />
          <ThreatTicker />
          <main className="flex-1" role="main">{children}</main>
          <footer className="border-t border-border bg-card/50" role="contentinfo">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
                      <path d="M4 6h.01" />
                      <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
                      <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />
                      <path d="M12 18h.01" />
                      <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="m13.41 10.59 5.66-5.66" />
                    </svg>
                    Security Intel Hub
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    The institutional standard for cybersecurity
                    intelligence. Trusted by security teams worldwide.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Intelligence
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li><a href="/intelligence" className="text-muted-foreground hover:text-foreground transition-colors">Intelligence</a></li>
                    <li><a href="/cve" className="text-muted-foreground hover:text-foreground transition-colors">CVE Search</a></li>
                    <li><a href="/threat-actors" className="text-muted-foreground hover:text-foreground transition-colors">Threat Actors</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Industries
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li><a href="/industry/healthcare" className="text-muted-foreground hover:text-foreground transition-colors">Healthcare</a></li>
                    <li><a href="/industry/finance" className="text-muted-foreground hover:text-foreground transition-colors">Finance</a></li>
                    <li><a href="/industry/government" className="text-muted-foreground hover:text-foreground transition-colors">Government</a></li>
                    <li><a href="/industry/energy" className="text-muted-foreground hover:text-foreground transition-colors">Energy</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li><a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                    <li><a href="/help" className="text-muted-foreground hover:text-foreground transition-colors">Help & Contact</a></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Security Intel Hub. All rights reserved. Intelligence data sourced from verified public sources.
              </div>
            </div>
          </footer>
        </TooltipProvider>
        </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
