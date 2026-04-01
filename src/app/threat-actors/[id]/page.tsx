export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import {
  fetchThreatActors,
  fetchThreatActorById,
  fetchThreatActorIds,
  fetchArticles,
} from "@/lib/queries";
import type { Metadata } from "next";
import {
  Users,
  Globe,
  Calendar,
  Target,
  Shield,
  ChevronRight,
  Crosshair,
  Building2,
} from "lucide-react";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const actor = await fetchThreatActorById(id);
  if (!actor) return { title: "Not Found" };
  return {
    title: `${actor.name} — Threat Actor Profile`,
    description: actor.description,
  };
}

export default async function ThreatActorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await fetchThreatActorById(id);
  if (!actor) notFound();

  const articles = await fetchArticles();
  const relatedArticles = articles.filter((a) =>
    a.threatActors.some(
      (t) => t === actor.name || actor.aliases.includes(t)
    )
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/threat-actors"
          className="hover:text-foreground transition-colors"
        >
          Threat Actors
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{actor.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-threat-high" />
              <h1 className="text-2xl font-bold tracking-tight">
                {actor.name}
              </h1>
            </div>
            {actor.aliases.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Also known as: {actor.aliases.join(", ")}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Overview
            </h2>
            <p className="text-sm leading-relaxed">{actor.description}</p>
          </div>

          {/* TTPs */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tactics, Techniques & Procedures
            </h2>
            <div className="flex flex-wrap gap-2">
              {actor.ttps.map((ttp) => (
                <Badge key={ttp} variant="outline" className="text-xs">
                  {ttp}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Related Articles */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Related Intelligence ({relatedArticles.length})
            </h2>
            {relatedArticles.length > 0 ? (
              <div className="space-y-3">
                {relatedArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No articles currently linked to this actor.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Origin
                </span>
              </div>
              <p className="text-sm font-semibold">{actor.origin}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Activity
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    First Seen
                  </div>
                  <div className="font-mono">{actor.firstSeen}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Last Active
                  </div>
                  <div className="font-mono">{actor.lastActive}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Target Industries
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {actor.targetIndustries.map((ind) => (
                  <Link key={ind} href={`/industry/${ind}`}>
                    <Badge
                      variant="outline"
                      className="text-xs capitalize hover:bg-accent transition-colors cursor-pointer"
                    >
                      {ind}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Linked Reports
                </span>
              </div>
              <p className="text-2xl font-mono font-bold text-primary">
                {relatedArticles.length}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
