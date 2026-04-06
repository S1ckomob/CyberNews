"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Search, X, BookOpen, MessageSquare, Users, Rss,
  ExternalLink, TrendingUp,
} from "lucide-react";
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

const REDDIT_SOURCES = ["r/cybersecurity", "r/netsec", "r/malware", "r/blueteamsec", "r/ransomware"];
const BLOG_SOURCES = [
  "Schneier on Security", "Troy Hunt", "Graham Cluley", "SANS ISC",
  "PortSwigger Daily Swig", "Microsoft MSRC", "Google TAG Blog",
  "AWS Security Bulletins", "Cisco Talos", "Unit 42 (Palo Alto)",
  "SentinelLabs", "Mandiant", "WeLiveSecurity (ESET)",
  "Securelist (Kaspersky)", "Trail of Bits", "Rapid7", "Qualys Blog",
  "Embrace The Red (AI Sec)",
];
const ALL_BLOG_REDDIT = [...REDDIT_SOURCES, ...BLOG_SOURCES];

type Tab = "all" | "reddit" | "blogs";

export default function BlogsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data.map(rowToArticle));
        setLoading(false);
      });

    // Poll every 60 seconds
    const interval = setInterval(() => {
      supabase
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false })
        .then(({ data }) => {
          if (data) setArticles(data.map(rowToArticle));
        });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filter to blog/reddit sources
  const blogArticles = useMemo(() => {
    return articles.filter((a) => ALL_BLOG_REDDIT.some((s) => a.source.includes(s)));
  }, [articles]);

  const redditArticles = useMemo(() => blogArticles.filter((a) => a.source.startsWith("r/")), [blogArticles]);
  const blogOnlyArticles = useMemo(() => blogArticles.filter((a) => !a.source.startsWith("r/")), [blogArticles]);

  // Apply tab + search
  const filtered = useMemo(() => {
    let result = activeTab === "reddit" ? redditArticles : activeTab === "blogs" ? blogOnlyArticles : blogArticles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [blogArticles, redditArticles, blogOnlyArticles, activeTab, search]);

  // Source counts for sidebar
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    blogArticles.forEach((a) => { counts[a.source] = (counts[a.source] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [blogArticles]);

  // Trending topics from blog articles
  const trendingTags = useMemo(() => {
    const tags: Record<string, number> = {};
    blogArticles.slice(0, 50).forEach((a) => a.tags.forEach((t) => { tags[t] = (tags[t] || 0) + 1; }));
    return Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [blogArticles]);

  const tabs: { id: Tab; label: string; icon: typeof BookOpen; count: number }[] = [
    { id: "all", label: "All", icon: Rss, count: blogArticles.length },
    { id: "reddit", label: "Reddit", icon: MessageSquare, count: redditArticles.length },
    { id: "blogs", label: "Blogs", icon: BookOpen, count: blogOnlyArticles.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blogs & Community</h1>
          <p className="text-sm text-muted-foreground">
            Security research, analysis, and discussion from top blogs and Reddit
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 my-6">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{blogArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-foreground">{redditArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reddit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-foreground">{blogOnlyArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Blogs</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
              <span className="font-mono text-[10px] opacity-70">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts, topics, sources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${filtered.length} post${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold">No posts found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Blog and Reddit content will appear as new posts are ingested
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered[0] && <ArticleCard article={filtered[0]} variant="featured" />}
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.slice(1).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Sources */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Rss className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Active Sources ({sourceCounts.length})
                </h3>
              </div>
              <div className="space-y-1">
                {sourceCounts.slice(0, 15).map(([source, count]) => (
                  <button
                    key={source}
                    onClick={() => setSearch(source)}
                    className="flex items-center justify-between w-full text-xs rounded px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <span className="truncate">{source}</span>
                    <span className="font-mono font-medium shrink-0 ml-2">{count}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          {trendingTags.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Trending Topics
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTags.map(([tag, count]) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] cursor-pointer hover:bg-accent"
                      onClick={() => setSearch(tag)}
                    >
                      #{tag} <span className="ml-1 font-mono text-primary">{count}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reddit Subreddits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-threat-high" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Subreddits
                </h3>
              </div>
              <div className="space-y-1">
                {REDDIT_SOURCES.map((sub) => {
                  const count = redditArticles.filter((a) => a.source === sub).length;
                  return (
                    <button
                      key={sub}
                      onClick={() => { setActiveTab("reddit"); setSearch(sub); }}
                      className="flex items-center justify-between w-full text-xs rounded px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <span>{sub}</span>
                      <span className="font-mono font-medium">{count}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
