"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { supabase } from "@/lib/supabase";
import type { ArticleRow } from "@/lib/supabase";
import type { Article, ThreatLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  AlertTriangle,
  Brain,
  Bot,
  TrendingUp,
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  Target,
} from "lucide-react";

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

const AI_KEYWORDS = [
  "ai ", " ai", "a.i.", "artificial intelligence",
  "llm", "large language model",
  "prompt injection", "jailbreak", "indirect prompt",
  "model poisoning", "model extraction", "adversarial",
  "machine learning", " ml ", "ml model", "ml pipeline",
  "deep learning", "neural network",
  "generative ai", "genai", "foundation model",
  "chatgpt", "gpt-", "gpt3", "gpt4", "openai",
  "claude", "anthropic", "gemini", "bard",
  "copilot", "github copilot",
  "ollama", "huggingface", "hugging face",
  "deepfake", "deep fake",
  "ai-powered", "ai powered", "ai-generated", "ai generated",
  "agentic", "ai agent", "autonomous agent",
  "rag ", "retrieval augmented",
  "data poisoning", "training data",
  "mcp ", "model context protocol",
] as const;

const AI_TOPICS = [
  { id: "prompt-injection", label: "Prompt Injection", keywords: ["prompt injection", "indirect prompt", "jailbreak"] },
  { id: "model-attacks", label: "Model Attacks", keywords: ["model poisoning", "adversarial", "model extraction", "data poisoning"] },
  { id: "deepfake", label: "Deepfakes", keywords: ["deepfake", "deep fake", "ai-generated", "voice clone"] },
  { id: "ai-phishing", label: "AI-Powered Phishing", keywords: ["ai-powered", "ai powered", "ai phishing", "generative"] },
  { id: "agents", label: "AI Agents / MCP", keywords: ["agentic", "ai agent", "autonomous agent", "mcp ", "model context protocol"] },
  { id: "copilot", label: "Copilot & Assistants", keywords: ["copilot", "github copilot", "microsoft copilot"] },
  { id: "openai", label: "OpenAI / ChatGPT", keywords: ["openai", "chatgpt", "gpt-"] },
  { id: "anthropic", label: "Anthropic / Claude", keywords: ["anthropic", "claude"] },
] as const;

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

function isAiArticle(a: Article): boolean {
  if (a.category === "ai") return true;
  const haystack = `${a.title} ${a.summary} ${a.tags.join(" ")} ${a.affectedProducts.join(" ")} ${a.attackVector}`.toLowerCase();
  return AI_KEYWORDS.some((kw) => haystack.includes(kw));
}

function getArticleTopics(a: Article): string[] {
  const haystack = `${a.title} ${a.summary} ${a.tags.join(" ")}`.toLowerCase();
  return AI_TOPICS.filter((t) => t.keywords.some((kw) => haystack.includes(kw))).map((t) => t.id);
}

export default function AiNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<ThreatLevel[]>([]);
  const [topicFilters, setTopicFilters] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (data) setArticles(data.map(rowToArticle));
    setLoading(false);
    setRefreshing(false);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    if (!supabase) return () => clearInterval(interval);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("ai-news-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => load())
        .subscribe();
    } catch {
      // polling handles it
    }
    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const aiArticles = useMemo(() => articles.filter(isAiArticle), [articles]);

  const toggleSeverity = (level: ThreatLevel) => {
    setSeverityFilters((prev) =>
      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
    );
  };
  const toggleTopic = (id: string) => {
    setTopicFilters((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };
  const activeFilterCount = severityFilters.length + topicFilters.length;
  const clearFilters = () => { setSeverityFilters([]); setTopicFilters([]); setSearch(""); };

  const filteredArticles = useMemo(() => {
    let list = aiArticles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.affectedProducts.some((p) => p.toLowerCase().includes(q)) ||
        a.cves.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (severityFilters.length > 0) {
      list = list.filter((a) => severityFilters.includes(a.threatLevel));
    }
    if (topicFilters.length > 0) {
      list = list.filter((a) => {
        const topics = getArticleTopics(a);
        return topicFilters.some((t) => topics.includes(t));
      });
    }
    return list;
  }, [aiArticles, search, severityFilters, topicFilters]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    aiArticles.forEach((a) => {
      getArticleTopics(a).forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    });
    return counts;
  }, [aiArticles]);

  const now = Date.now();
  const last24h = useMemo(
    () => aiArticles.filter((a) => now - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000),
    [aiArticles, now]
  );
  const last7d = useMemo(
    () => aiArticles.filter((a) => now - new Date(a.publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000),
    [aiArticles, now]
  );
  const criticalCount = useMemo(
    () => filteredArticles.filter((a) => a.threatLevel === "critical").length,
    [filteredArticles]
  );
  const aiCves = useMemo(
    () => [...new Set(aiArticles.flatMap((a) => a.cves))],
    [aiArticles]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">AI News &amp; Alerts</h1>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">AI News &amp; Alerts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-threat-pulse" />
            LIVE
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        AI threats, LLM vulnerabilities, prompt injection, deepfakes, and model security — updated continuously
        {lastUpdated && <span className="ml-2 text-xs">&middot; Updated {lastUpdated.toLocaleTimeString()}</span>}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{aiArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{last24h.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last 24h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{criticalCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{aiCves.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI-Related CVEs</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search AI threats, models, CVEs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-1.5", showFilters && "bg-accent")}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Severity</h4>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITY_OPTIONS.map((level) => (
                  <Badge
                    key={level}
                    variant={severityFilters.includes(level) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer capitalize",
                      severityFilters.includes(level) && `bg-threat-${level} hover:bg-threat-${level}/80`
                    )}
                    onClick={() => toggleSeverity(level)}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Topics</h4>
              <div className="flex flex-wrap gap-1.5">
                {AI_TOPICS.map((topic) => (
                  <Badge
                    key={topic.id}
                    variant={topicFilters.includes(topic.id) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTopic(topic.id)}
                  >
                    {topic.label}
                    {topicCounts[topic.id] > 0 && (
                      <span className="ml-1.5 font-mono text-[10px] opacity-70">{topicCounts[topic.id]}</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Main feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                AI Security Feed ({filteredArticles.length})
              </h2>
            </div>
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No AI-related articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredArticles[0] && <ArticleCard article={filteredArticles[0]} variant="featured" />}
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredArticles.slice(1).map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* This week */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  This Week
                </h3>
              </div>
              <div className="space-y-1">
                {last7d.slice(0, 5).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
                {last7d.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nothing new this week.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Topic breakdown */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Topic Breakdown
                </h3>
              </div>
              <div className="space-y-1">
                {AI_TOPICS
                  .map((t) => ({ ...t, count: topicCounts[t.id] || 0 }))
                  .filter((t) => t.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTopic(t.id)}
                      className={cn(
                        "flex items-center justify-between w-full text-xs rounded px-2 py-1.5 transition-colors",
                        topicFilters.includes(t.id)
                          ? "bg-primary/10 text-foreground"
                          : "hover:bg-accent text-muted-foreground"
                      )}
                    >
                      <span>{t.label}</span>
                      <span className="font-mono font-medium w-6 text-right">{t.count}</span>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical AI alerts */}
          {criticalCount > 0 && (
            <Card className="border-threat-critical/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-threat-critical" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                    Critical AI Threats
                  </h3>
                </div>
                <div className="space-y-1">
                  {filteredArticles
                    .filter((a) => a.threatLevel === "critical")
                    .slice(0, 5)
                    .map((a) => (
                      <ArticleCard key={a.id} article={a} variant="compact" />
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI CVEs */}
          {aiCves.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    AI-Related CVEs
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {aiCves.slice(0, 12).map((cve) => (
                    <a
                      key={cve}
                      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="secondary" className="font-mono text-[10px] hover:bg-accent cursor-pointer">
                        {cve}
                      </Badge>
                    </a>
                  ))}
                  {aiCves.length > 12 && (
                    <Badge variant="secondary" className="text-[10px]">+{aiCves.length - 12} more</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
