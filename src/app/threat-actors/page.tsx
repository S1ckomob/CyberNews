export const revalidate = 60;

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActorGraph } from "@/components/actor-graph";
import { fetchThreatActors, fetchArticles } from "@/lib/queries";
import { Users, Globe, Calendar, Target, ChevronRight } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";

export const metadata = {
  title: "Threat Actor Profiles — APT Groups, Ransomware Gangs & State Actors",
  description:
    "Comprehensive profiles of active threat actors including APT groups, ransomware gangs, and state-sponsored hackers. TTPs, MITRE ATT&CK mappings, target industries, and related intelligence.",
  alternates: { canonical: `${siteUrl}/threat-actors` },
  openGraph: {
    title: "Threat Actor Profiles | Security Intel Hub",
    description: "Comprehensive threat actor profiles with TTPs, MITRE ATT&CK mappings, and related intelligence.",
    type: "website",
    url: `${siteUrl}/threat-actors`,
    siteName: "Security Intel Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Threat Actor Profiles — APT Groups & Ransomware Gangs",
    description: "Threat actor profiles with TTPs, MITRE ATT&CK mappings, and linked intelligence.",
  },
};

export default async function ThreatActorsPage() {
  const threatActors = await fetchThreatActors();
  const articles = await fetchArticles();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Threat Actor Profiles
        </h1>
        <p className="text-sm text-muted-foreground">
          Active threat groups tracked by our intelligence team
        </p>
      </div>

      {/* Relationship Graph */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Threat Actor Relationships
          </h2>
          <ActorGraph actors={threatActors} articles={articles} />
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {threatActors.map((actor) => {
          const relatedCount = articles.filter((a) =>
            a.threatActors.some(
              (t) =>
                t === actor.name ||
                actor.aliases.includes(t)
            )
          ).length;

          return (
            <Link key={actor.id} href={`/threat-actors/${actor.id}`}>
              <Card className="group h-full transition-all hover:shadow-md hover:border-threat-high/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-threat-high" />
                      <h2 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {actor.name}
                      </h2>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {actor.aliases.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      aka {actor.aliases.join(", ")}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {actor.description}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {actor.origin}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Since {actor.firstSeen}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {relatedCount} articles
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {actor.targetIndustries.slice(0, 3).map((ind) => (
                      <Badge
                        key={ind}
                        variant="secondary"
                        className="text-[10px] capitalize"
                      >
                        {ind}
                      </Badge>
                    ))}
                    {actor.targetIndustries.length > 3 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{actor.targetIndustries.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
