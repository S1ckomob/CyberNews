"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThreatBadge } from "@/components/threat-badge";
import { ExploitStatusBadge } from "@/components/exploit-status-badge";
import type { Article } from "@/lib/types";
import {
  Clock,
  Shield,
  Tag,
  Globe,
  Zap,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BORDER_COLORS: Record<string, string> = {
  critical: "border-l-[3px] border-l-threat-critical",
  high: "border-l-[3px] border-l-threat-high",
  medium: "border-l-[3px] border-l-threat-medium",
  low: "border-l-[3px] border-l-threat-low",
};

function isNew(dateString: string): boolean {
  return Date.now() - new Date(dateString).getTime() < 60 * 60 * 1000;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function categoryLabel(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "compact" | "featured";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  if (variant === "featured") {
    return (
      <Link href={`/article/${article.slug}`}>
        <Card className="group relative overflow-hidden border-threat-critical/25 bg-gradient-to-br from-card via-card to-threat-critical/8 transition-all hover:border-threat-critical/50 hover:shadow-xl hover:shadow-threat-critical/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-threat-critical rounded-l" />
          <CardContent className="p-6 pl-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <ThreatBadge level={article.threatLevel} pulse />
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {categoryLabel(article.category)}
                  </Badge>
                  {article.verified && (
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <Shield className="h-3 w-3" />
                      Verified
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {article.summary}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(article.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {article.region}
                  </span>
                  <span className="font-mono text-muted-foreground/70">
                    {article.source}
                  </span>
                  {article.cves.length > 0 && (
                    <span className="flex items-center gap-1 font-mono text-threat-high">
                      <Tag className="h-3 w-3" />
                      {article.cves[0]}
                      {article.cves.length > 1 && ` +${article.cves.length - 1}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/article/${article.slug}`}>
        <div className={cn("group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-all hover:border-border hover:bg-card border-l-2", `border-l-threat-${article.threatLevel}`)}>
          <div className="mt-0.5">
            <ThreatBadge level={article.threatLevel} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDate(article.publishedAt)}</span>
              <span>&middot;</span>
              <span className="font-mono">{article.source}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`}>
      <Card
        className={cn(
          "group transition-all hover:shadow-md",
          BORDER_COLORS[article.threatLevel],
          article.threatLevel === "critical" &&
            "border-threat-critical/20 hover:border-threat-critical/40",
          article.threatLevel === "high" &&
            "border-threat-high/10 hover:border-threat-high/30"
        )}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ThreatBadge level={article.threatLevel} />
              <Badge variant="outline" className="text-[10px] font-mono">
                {categoryLabel(article.category)}
              </Badge>
              {isNew(article.publishedAt) && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 animate-threat-pulse gap-1">
                  <Zap className="h-2.5 w-2.5" />NEW
                </Badge>
              )}
              <ExploitStatusBadge article={article} />
              {article.verified && (
                <div className="flex items-center gap-1 text-[10px] text-primary">
                  <Shield className="h-3 w-3" />
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {article.summary}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {article.cves.slice(0, 2).map((cve) => (
                <span
                  key={cve}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {cve}
                </span>
              ))}
              {article.affectedProducts.slice(0, 1).map((p) => (
                <span
                  key={p}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <time dateTime={article.publishedAt} className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(article.publishedAt)}
              </time>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[10px]">{article.source}</span>
                {article.sourceUrl && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(article.sourceUrl, "_blank", "noopener,noreferrer"); }}
                    className="text-muted-foreground/50 hover:text-primary transition-colors"
                    title="Open original source"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
