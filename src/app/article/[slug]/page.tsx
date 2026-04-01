import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThreatBadge } from "@/components/threat-badge";
import { ArticleCard } from "@/components/article-card";
import {
  fetchArticles,
  fetchArticleBySlug,
  fetchThreatActors,
  fetchArticleSlugs,
} from "@/lib/queries";
import type { Metadata } from "next";
import {
  Shield,
  Clock,
  Globe,
  Tag,
  AlertTriangle,
  Box,
  Users,
  Building2,
  Crosshair,
  ExternalLink,
  Share2,
  Bookmark,
  Bell,
  ChevronRight,
  CalendarClock,
} from "lucide-react";

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateStaticParams() {
  const slugs = await fetchArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) return { title: "Not Found" };
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();

  const articles = await fetchArticles();
  const relatedArticles = articles
    .filter(
      (a) =>
        a.id !== article.id &&
        (a.cves.some((c) => article.cves.includes(c)) ||
          a.threatActors.some((t) => article.threatActors.includes(t)) ||
          a.affectedProducts.some((p) =>
            article.affectedProducts.includes(p)
          ) ||
          a.category === article.category)
    )
    .slice(0, 3);

  const threatActors = await fetchThreatActors();
  const linkedActors = threatActors.filter((a) =>
    article.threatActors.some(
      (name) =>
        a.name === name ||
        a.aliases.includes(name) ||
        a.id === name.toLowerCase().replace(/\s+/g, "-")
    )
  );

  const timelineEvents = [
    article.discoveredAt && {
      label: "Discovered",
      date: article.discoveredAt,
    },
    article.exploitedAt && {
      label: "Exploitation Detected",
      date: article.exploitedAt,
    },
    { label: "Published", date: article.publishedAt },
    article.patchedAt && { label: "Patch Available", date: article.patchedAt },
  ].filter(Boolean) as { label: string; date: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-xs">{article.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <ThreatBadge level={article.threatLevel} pulse />
              <Badge variant="outline" className="font-mono text-xs">
                {article.category
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </Badge>
              {article.verified && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Verified
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {article.region}
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl leading-tight">
              {article.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatFullDate(article.publishedAt)}
              </span>
              <span>&middot;</span>
              <span className="font-mono text-xs">
                Source: {article.source}
              </span>
            </div>
            {article.updatedAt !== article.publishedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Updated: {formatFullDate(article.updatedAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Bookmark className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Bell className="h-3.5 w-3.5" />
              Alert me
            </Button>
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Original Source
                </Button>
              </a>
            )}
          </div>

          <Separator />

          {/* Summary */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Executive Summary
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {article.summary}
            </p>
          </div>

          {/* Full Content */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Analysis
            </h2>
            <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-foreground/80">
              {article.content}
            </div>
          </div>

          {/* Timeline */}
          {timelineEvents.length > 1 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Timeline
              </h2>
              <div className="relative space-y-4 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <span className="absolute left-[-17px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                    <div>
                      <div className="text-xs font-semibold">{event.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {formatShortDate(event.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Attribution */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">
                  Source Attribution
                </span>
              </div>
              <p>
                Originally published by {article.source} on{" "}
                {formatShortDate(article.publishedAt)}.
                {article.verifiedBy.length > 0 && (
                  <> Verified by: {article.verifiedBy.join(", ")}.</>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Related Threats */}
          {relatedArticles.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Related Threats
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Metadata Cards */}
        <aside className="space-y-4">
          {/* CVEs */}
          {article.cves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    CVEs Affected
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {article.cves.map((cve) => (
                    <Link
                      key={cve}
                      href={`/cve?q=${cve}`}
                      className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-threat-high" />
                      {cve}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Products */}
          {article.affectedProducts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Box className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Affected Products
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {article.affectedProducts.map((product) => (
                    <Badge key={product} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Threat Actors */}
          {linkedActors.length > 0 && (
            <Card className="border-threat-high/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-threat-high" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Threat Actors
                  </h3>
                </div>
                {linkedActors.map((actor) => (
                  <Link
                    key={actor.id}
                    href={`/threat-actors/${actor.id}`}
                    className="block rounded-md bg-muted p-3 hover:bg-accent transition-colors"
                  >
                    <div className="font-semibold text-sm">{actor.name}</div>
                    {actor.aliases.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        aka {actor.aliases.slice(0, 2).join(", ")}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Origin: {actor.origin}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Industries */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Industry Impact
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {article.industries.map((industry) => (
                  <Link
                    key={industry}
                    href={`/industry/${industry}`}
                  >
                    <Badge
                      variant="outline"
                      className="text-xs capitalize hover:bg-accent transition-colors cursor-pointer"
                    >
                      {industry}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attack Vector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Attack Vector
                </h3>
              </div>
              <p className="text-sm font-mono">{article.attackVector}</p>
            </CardContent>
          </Card>

          {/* Verified By */}
          {article.verifiedBy.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Verified By
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {article.verifiedBy.map((v) => (
                    <div
                      key={v}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Shield className="h-3 w-3 text-primary" />
                      {v}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
