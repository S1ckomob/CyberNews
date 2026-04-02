"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import type { ArticleRow } from "@/lib/supabase";
import {
  Shield, Target, AlertTriangle, Plus, X, Search,
  CheckCircle, XCircle, Flame, Bug, BarChart3,
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
  "FortiGate", "FortiOS", "FortiManager", "PAN-OS", "GlobalProtect",
  "Cisco ASA", "Cisco IOS", "SonicWall SMA", "Ivanti Connect Secure",
  "Windows Server", "Windows 10", "Windows 11", "Active Directory",
  "Microsoft Exchange", "Microsoft 365", "Azure AD", "Hyper-V",
  "VMware ESXi", "vCenter Server", "Linux Kernel",
  "Google Chrome", "Microsoft Edge",
  "Apache", "Nginx", "Jenkins", "WordPress",
  "AWS", "Azure", "GCP",
];

const STORAGE_KEY = "cyberintel-attack-surface";

function loadProducts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveProducts(products: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export default function AttackSurfacePage() {
  const [products, setProducts] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProducts(loadProducts());
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data.map(rowToArticle));
        setLoading(false);
      });
  }, []);

  function addProduct(name: string) {
    if (!name.trim() || products.includes(name.trim())) return;
    const updated = [...products, name.trim()];
    setProducts(updated);
    saveProducts(updated);
    setNewProduct("");
  }

  function removeProduct(name: string) {
    const updated = products.filter((p) => p !== name);
    setProducts(updated);
    saveProducts(updated);
  }

  // Match articles to user's products
  const matches = useMemo(() => {
    if (products.length === 0) return [];
    return articles.filter((a) => {
      const text = `${a.title} ${a.affectedProducts.join(" ")} ${a.summary} ${a.content}`.toLowerCase();
      return products.some((p) => text.includes(p.toLowerCase()));
    });
  }, [articles, products]);

  const criticalMatches = matches.filter((a) => a.threatLevel === "critical");
  const highMatches = matches.filter((a) => a.threatLevel === "high");
  const exploitedMatches = matches.filter((a) => a.exploitedAt);
  const unpatchedMatches = matches.filter((a) => !a.patchedAt && (a.threatLevel === "critical" || a.threatLevel === "high"));
  const allCves = [...new Set(matches.flatMap((a) => a.cves))];
  const allActors = [...new Set(matches.flatMap((a) => a.threatActors).filter(Boolean))];

  // Risk score: 0-100
  const riskScore = useMemo(() => {
    if (products.length === 0 || matches.length === 0) return 0;
    let score = 0;
    score += criticalMatches.length * 15;
    score += highMatches.length * 8;
    score += exploitedMatches.length * 20;
    score += unpatchedMatches.length * 10;
    return Math.min(100, score);
  }, [matches, criticalMatches, highMatches, exploitedMatches, unpatchedMatches, products]);

  function riskColor(score: number) {
    if (score >= 75) return "text-threat-critical";
    if (score >= 50) return "text-threat-high";
    if (score >= 25) return "text-threat-medium";
    return "text-primary";
  }

  function riskLabel(score: number) {
    if (score >= 75) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 25) return "MODERATE";
    if (score > 0) return "LOW";
    return "—";
  }

  // Per-product breakdown
  const productBreakdown = useMemo(() => {
    return products.map((product) => {
      const pMatches = articles.filter((a) => {
        const text = `${a.title} ${a.affectedProducts.join(" ")} ${a.summary}`.toLowerCase();
        return text.includes(product.toLowerCase());
      });
      const critical = pMatches.filter((a) => a.threatLevel === "critical").length;
      const high = pMatches.filter((a) => a.threatLevel === "high").length;
      const exploited = pMatches.filter((a) => a.exploitedAt).length;
      const cves = [...new Set(pMatches.flatMap((a) => a.cves))].length;
      return { product, total: pMatches.length, critical, high, exploited, cves };
    }).sort((a, b) => b.critical * 10 + b.total - (a.critical * 10 + a.total));
  }, [products, articles]);

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Attack Surface Calculator</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Enter the products in your environment. We'll show every threat that affects you.
      </p>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Left: Product Input */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Your Products</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="e.g. FortiGate"
                  className="text-xs h-8"
                  onKeyDown={(e) => e.key === "Enter" && addProduct(newProduct)}
                />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addProduct(newProduct)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {products.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {products.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs gap-1 pr-1">
                      {p}
                      <button onClick={() => removeProduct(p)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Separator className="my-3" />
              <p className="text-[10px] text-muted-foreground mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_PRODUCTS.filter((p) => !products.includes(p)).slice(0, 12).map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] cursor-pointer hover:bg-accent"
                    onClick={() => addProduct(p)}>
                    + {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Score */}
          {products.length > 0 && (
            <Card className={cn(
              riskScore >= 75 ? "border-threat-critical/30 bg-threat-critical/5" :
              riskScore >= 50 ? "border-threat-high/30 bg-threat-high/5" : ""
            )}>
              <CardContent className="p-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Risk Score
                </h3>
                <div className={cn("text-5xl font-mono font-bold", riskColor(riskScore))}>
                  {riskScore}
                </div>
                <div className={cn("text-xs font-bold uppercase tracking-wider mt-1", riskColor(riskScore))}>
                  {riskLabel(riskScore)}
                </div>
                {/* Score bar */}
                <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${riskScore}%`,
                      backgroundColor: riskScore >= 75 ? "var(--threat-critical)" : riskScore >= 50 ? "var(--threat-high)" : riskScore >= 25 ? "var(--threat-medium)" : "var(--color-primary)",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {products.length > 0 && matches.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-mono font-bold text-threat-critical">{criticalMatches.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Critical</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-mono font-bold text-threat-high">{exploitedMatches.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Exploited</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-mono font-bold text-primary">{allCves.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">CVEs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-mono font-bold text-threat-high">{allActors.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Actors</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold">Add your products</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Enter the software and hardware in your environment.
                  We'll calculate your exposure across all known threats.
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Per-product breakdown */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
                  Product Exposure
                </h2>
                <div className="space-y-2">
                  {productBreakdown.map((pb) => (
                    <Card key={pb.product} className={cn(
                      pb.critical > 0 && "border-l-[3px] border-l-threat-critical",
                      pb.critical === 0 && pb.high > 0 && "border-l-[3px] border-l-threat-high",
                      pb.total === 0 && "opacity-50",
                    )}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">{pb.product}</h4>
                          <p className="text-xs text-muted-foreground">
                            {pb.total} threats · {pb.cves} CVEs
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {pb.exploited > 0 && (
                            <span className="flex items-center gap-1 text-threat-critical">
                              <Flame className="h-3 w-3" /> {pb.exploited}
                            </span>
                          )}
                          {pb.critical > 0 && (
                            <Badge variant="outline" className="text-[10px] text-threat-critical border-threat-critical/30">
                              {pb.critical} critical
                            </Badge>
                          )}
                          {pb.high > 0 && (
                            <Badge variant="outline" className="text-[10px] text-threat-high border-threat-high/30">
                              {pb.high} high
                            </Badge>
                          )}
                          {pb.total === 0 && (
                            <span className="flex items-center gap-1 text-primary text-xs">
                              <CheckCircle className="h-3 w-3" /> Clear
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Matching threats */}
              {matches.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">
                      Threats Affecting Your Environment ({matches.length})
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {matches.slice(0, 20).map((a) => (
                        <ArticleCard key={a.id} article={a} />
                      ))}
                    </div>
                    {matches.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        +{matches.length - 20} more threats
                      </p>
                    )}
                  </div>
                </>
              )}

              {matches.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="text-sm font-semibold">No matching threats</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      No current articles match your products. This is good news.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
