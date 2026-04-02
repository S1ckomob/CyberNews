"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface FeedItem {
  id: string;
  title: string;
  slug: string;
  threat_level: string;
  source: string;
  published_at: string;
  timestamp: Date;
}

const LEVEL_COLORS: Record<string, string> = {
  critical: "text-threat-critical",
  high: "text-threat-high",
  medium: "text-threat-medium",
  low: "text-threat-low",
};

const DOT_COLORS: Record<string, string> = {
  critical: "bg-threat-critical",
  high: "bg-threat-high",
  medium: "bg-threat-medium",
  low: "bg-threat-low",
};

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase) return;

    async function load() {
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, threat_level, source, published_at")
        .order("published_at", { ascending: false })
        .limit(25);
      if (data) {
        setItems(
          (data as FeedItem[]).map((d) => ({ ...d, timestamp: new Date(d.published_at) }))
        );
      }
    }
    load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("activity-feed")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, (payload) => {
          const row = payload.new as FeedItem;
          setItems((prev) => [{ ...row, timestamp: new Date(row.published_at) }, ...prev].slice(0, 25));
          setNewIds((prev) => new Set(prev).add(row.id));
          setTimeout(() => setNewIds((prev) => { const next = new Set(prev); next.delete(row.id); return next; }), 3000);
        })
        .subscribe();
    } catch {
      // WebSocket may not be available in all environments
    }

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  if (items.length === 0) return null;

  function formatTime(date: Date) {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-0.5 pr-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/article/${item.slug}`}
            className={cn(
              "flex items-start gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-accent/50",
              newIds.has(item.id) && "animate-slide-in bg-accent/30"
            )}
          >
            <span className="font-mono text-[10px] text-muted-foreground shrink-0 w-10 mt-0.5">
              {formatTime(item.timestamp)}
            </span>
            <span className={cn("shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full", DOT_COLORS[item.threat_level] || DOT_COLORS.medium)} />
            <span className="flex-1 leading-tight">
              <span className={cn("font-mono text-[10px] font-bold uppercase mr-1.5", LEVEL_COLORS[item.threat_level] || LEVEL_COLORS.medium)}>
                {item.threat_level.slice(0, 4)}
              </span>
              <span className="text-foreground/90">{item.title.length > 80 ? item.title.slice(0, 80) + "..." : item.title}</span>
            </span>
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
}
