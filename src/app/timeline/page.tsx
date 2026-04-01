"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { ExploitStatusBadge } from "@/components/exploit-status-badge";
import { supabase } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import { Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id, title: row.title, slug: row.slug, summary: row.summary,
    content: row.content, threatLevel: row.threat_level,
    category: row.category as Article["category"], cves: row.cves,
    affectedProducts: row.affected_products, threatActors: row.threat_actors,
    industries: row.industries as Article["industries"],
    attackVector: row.attack_vector, source: row.source, sourceUrl: row.source_url,
    publishedAt: row.published_at, updatedAt: row.updated_at,
    discoveredAt: row.discovered_at ?? "", exploitedAt: row.exploited_at ?? undefined,
    patchedAt: row.patched_at ?? undefined, verified: row.verified,
    verifiedBy: row.verified_by, tags: row.tags, region: row.region,
  };
}

const DOT_COLORS: Record<string, string> = {
  critical: "bg-threat-critical",
  high: "bg-threat-high",
  medium: "bg-threat-medium",
  low: "bg-threat-low",
};

const BORDER_COLORS: Record<string, string> = {
  critical: "border-threat-critical",
  high: "border-threat-high",
  medium: "border-threat-medium",
  low: "border-threat-low",
};

function formatGroupDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default function TimelinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<ThreatLevel | null>(null);

  useEffect(() => {
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setArticles(data.map(rowToArticle));
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!severityFilter) return articles;
    return articles.filter((a) => a.threatLevel === severityFilter);
  }, [articles, severityFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; articles: Article[] }[] = [];
    let currentDate = "";
    for (const a of filtered) {
      const date = new Date(a.publishedAt).toDateString();
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date: a.publishedAt, articles: [] });
      }
      groups[groups.length - 1].articles.push(a);
    }
    return groups;
  }, [filtered]);

  const levels: ThreatLevel[] = ["critical", "high", "medium", "low"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Threat Timeline</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Chronological view of threat activity
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSeverityFilter(severityFilter === level ? null : level)}
              className={cn("transition-opacity", severityFilter && severityFilter !== level && "opacity-30")}
            >
              <ThreatBadge level={level} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

          {grouped.map((group) => (
            <div key={group.date} className="mb-6">
              {/* Date header */}
              <div className="relative flex items-center gap-3 mb-3">
                <div className="h-[9px] w-[9px] rounded-full bg-primary border-2 border-background z-10 ml-[11px]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                  {formatGroupDate(group.date)}
                </h2>
              </div>

              {/* Articles */}
              <div className="space-y-2 pl-10">
                {group.articles.map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`}>
                    <div className={cn(
                      "group relative flex gap-3 rounded-lg border p-3 transition-all hover:shadow-md hover:bg-card/80 border-l-[3px]",
                      BORDER_COLORS[article.threatLevel]
                    )}>
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute -left-[26px] top-4 h-2 w-2 rounded-full z-10",
                        DOT_COLORS[article.threatLevel]
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatTime(article.publishedAt)}
                          </span>
                          <ThreatBadge level={article.threatLevel} size="sm" />
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {article.category}
                          </Badge>
                          <ExploitStatusBadge article={article} />
                        </div>
                        <h3 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {article.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {article.cves.slice(0, 2).map((cve) => (
                            <span key={cve} className="font-mono text-[10px] text-threat-high bg-threat-high/10 px-1 rounded">
                              {cve}
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground">{article.source}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
