export const revalidate = 60;

import { Card, CardContent } from "@/components/ui/card";
import { ArticleCard } from "@/components/article-card";
import { InteractiveMapView } from "@/components/interactive-map-view";
import { fetchArticlesLimited } from "@/lib/queries";
import { Globe, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";

export const metadata: Metadata = {
  title: "Global Cyber Threat Map — Live Attack Visualization",
  description: "Live interactive map of global cybersecurity threats by geographic region. Track cyber attacks, threat actors, and vulnerabilities across the world in real-time.",
  alternates: { canonical: `${siteUrl}/map` },
  openGraph: {
    title: "Global Cyber Threat Map | Security Intel Hub",
    description: "Live interactive visualization of global cybersecurity threats by geographic region.",
    type: "website",
    url: `${siteUrl}/map`,
    siteName: "Security Intel Hub",
  },
};

export default async function MapPage() {
  const articles = await fetchArticlesLimited(100);

  const recentCritical = articles
    .filter((a) => a.threatLevel === "critical")
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Globe className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Global Threat Map</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Geographic distribution of cybersecurity threats. Click a region to see its threats below.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <InteractiveMapView articles={articles} />

        {/* Sidebar — Recent Critical */}
        <aside className="space-y-4">
          <Card className="border-threat-critical/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                  Critical Threats
                </h3>
              </div>
              <div className="space-y-1">
                {recentCritical.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
