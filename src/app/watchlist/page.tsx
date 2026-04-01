"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  type Watchlist,
} from "@/lib/watchlist";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Eye,
  Plus,
  X,
  Box,
  Users,
  Tag,
  AlertTriangle,
  Search,
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

const SUGGESTED_PRODUCTS = [
  "FortiGate", "FortiOS", "PAN-OS", "Cisco ASA", "Windows Server",
  "VMware ESXi", "Microsoft Exchange", "Ivanti Connect Secure",
  "SonicWall SMA", "Chrome", "Linux Kernel", "Azure", "AWS",
  "Active Directory", "Microsoft 365", "Juniper Junos",
];

const SUGGESTED_ACTORS = [
  "APT29", "APT28", "LockBit", "Cl0p", "Scattered Spider",
  "Salt Typhoon", "Volt Typhoon", "Sandworm", "Lazarus Group",
  "Black Basta", "Rhysida", "Medusa", "UNC3886",
];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<Watchlist>({ products: [], actors: [], cves: [] });
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState("");
  const [newActor, setNewActor] = useState("");
  const [newCve, setNewCve] = useState("");

  useEffect(() => {
    setWatchlist(getWatchlist());
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data.map(rowToArticle));
        setLoading(false);
      });
  }, []);

  const matchedArticles = useMemo(() => {
    if (watchlist.products.length === 0 && watchlist.actors.length === 0 && watchlist.cves.length === 0) {
      return [];
    }
    return articles.filter((a) => {
      const text = `${a.title} ${a.affectedProducts.join(" ")} ${a.threatActors.join(" ")} ${a.cves.join(" ")}`.toLowerCase();
      return (
        watchlist.products.some((p) => text.includes(p.toLowerCase())) ||
        watchlist.actors.some((ac) => text.includes(ac.toLowerCase())) ||
        watchlist.cves.some((c) => text.includes(c.toLowerCase()))
      );
    });
  }, [articles, watchlist]);

  function handleAdd(type: keyof Watchlist, value: string, setter: (v: string) => void) {
    if (!value.trim()) return;
    setWatchlist(addToWatchlist(type, value.trim()));
    setter("");
  }

  function handleRemove(type: keyof Watchlist, value: string) {
    setWatchlist(removeFromWatchlist(type, value));
  }

  const isEmpty = watchlist.products.length === 0 && watchlist.actors.length === 0 && watchlist.cves.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Eye className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">My Watchlist</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Monitor specific products, threat actors, and CVEs. Matching articles appear automatically.
      </p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Watchlist Config */}
        <aside className="space-y-4">
          {/* Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Products ({watchlist.products.length})</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <Input value={newProduct} onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="e.g. FortiGate" className="text-xs h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd("products", newProduct, setNewProduct)} />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleAdd("products", newProduct, setNewProduct)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {watchlist.products.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs gap-1 pr-1">
                    {p}
                    <button onClick={() => handleRemove("products", p)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              {watchlist.products.length === 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_PRODUCTS.slice(0, 8).map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px] cursor-pointer hover:bg-accent"
                        onClick={() => setWatchlist(addToWatchlist("products", p))}>
                        + {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actors */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-threat-high" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Threat Actors ({watchlist.actors.length})</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <Input value={newActor} onChange={(e) => setNewActor(e.target.value)}
                  placeholder="e.g. APT29" className="text-xs h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd("actors", newActor, setNewActor)} />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleAdd("actors", newActor, setNewActor)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {watchlist.actors.map((a) => (
                  <Badge key={a} variant="secondary" className="text-xs gap-1 pr-1">
                    {a}
                    <button onClick={() => handleRemove("actors", a)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              {watchlist.actors.length === 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_ACTORS.slice(0, 8).map((a) => (
                      <Badge key={a} variant="outline" className="text-[10px] cursor-pointer hover:bg-accent"
                        onClick={() => setWatchlist(addToWatchlist("actors", a))}>
                        + {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CVEs */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-threat-medium" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">CVEs ({watchlist.cves.length})</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <Input value={newCve} onChange={(e) => setNewCve(e.target.value)}
                  placeholder="e.g. CVE-2026-0015" className="text-xs h-8 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd("cves", newCve, setNewCve)} />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleAdd("cves", newCve, setNewCve)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {watchlist.cves.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs font-mono gap-1 pr-1">
                    {c}
                    <button onClick={() => handleRemove("cves", c)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Matching Articles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {isEmpty ? "Add items to your watchlist to see matching threats" : `${matchedArticles.length} matching ${matchedArticles.length === 1 ? "article" : "articles"}`}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : isEmpty ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Eye className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold">Your watchlist is empty</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Add products, threat actors, or CVEs you care about. We&apos;ll show you every article that matches.
                </p>
              </CardContent>
            </Card>
          ) : matchedArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold">No matching articles</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  No current articles match your watchlist. New matches will appear as threats are ingested.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {matchedArticles.filter((a) => a.threatLevel === "critical").length > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-threat-critical" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    {matchedArticles.filter((a) => a.threatLevel === "critical").length} critical matches
                  </span>
                </div>
              )}
              {matchedArticles.slice(0, 2).map((a) => (
                <ArticleCard key={a.id} article={a} variant="featured" />
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                {matchedArticles.slice(2).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
