"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ArticleRow } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const THREAT_COLORS: Record<string, string> = {
  critical: "text-threat-critical",
  high: "text-threat-high",
  medium: "text-threat-medium",
  low: "text-threat-low",
};

const THREAT_DOTS: Record<string, string> = {
  critical: "bg-threat-critical",
  high: "bg-threat-high",
  medium: "bg-threat-medium",
  low: "bg-threat-low",
};

export function ThreatTicker() {
  const [articles, setArticles] = useState<
    { title: string; slug: string; threat_level: string; source: string; published_at: string }[]
  >([]);

  useEffect(() => {
    if (!supabase) return;

    async function load() {
      const { data } = await supabase
        .from("articles")
        .select("title, slug, threat_level, source, published_at")
        .in("threat_level", ["critical", "high"])
        .order("published_at", { ascending: false })
        .limit(50);
      if (data) setArticles(data as typeof articles);
    }
    load();

    // Poll every 60 seconds
    const interval = setInterval(load, 60000);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("ticker-realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, () => load())
        .subscribe();
    } catch {
      // WebSocket may not be available — polling handles it
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (articles.length === 0) return null;

  // Double the items for seamless loop
  const items = [...articles, ...articles];

  return (
    <div className="relative overflow-hidden border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 border-r border-border bg-threat-critical/10 px-3 py-1.5 z-10">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-threat-critical">
            <span className="h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
            LIVE
          </span>
        </div>

        {/* Scrolling content */}
        <div className="overflow-hidden flex-1">
          <div className="flex animate-ticker whitespace-nowrap">
            {items.map((article, i) => (
              <Link
                key={`${article.slug}-${i}`}
                href={`/article/${article.slug}`}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs hover:bg-accent/50 transition-colors shrink-0"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", THREAT_DOTS[article.threat_level] || THREAT_DOTS.medium)} />
                <span className={cn("font-mono text-[10px] font-bold uppercase", THREAT_COLORS[article.threat_level] || THREAT_COLORS.medium)}>
                  {article.threat_level}
                </span>
                <span className="text-foreground/90 truncate max-w-[200px] sm:max-w-xs">
                  {article.title.length > 60 ? article.title.slice(0, 60) + "..." : article.title}
                </span>
                <span className="text-muted-foreground/50 text-[10px]">{article.source}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
