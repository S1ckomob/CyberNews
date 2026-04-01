"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "@/components/threat-badge";
import { supabase } from "@/lib/supabase";
import type { ArticleRow } from "@/lib/supabase";
import type { ThreatLevel, Category, Industry } from "@/lib/types";
import {
  Plus,
  RefreshCw,
  Trash2,
  Zap,
  Download,
  Sparkles,
  Send,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pencil,
} from "lucide-react";

const CATEGORIES: Category[] = [
  "vulnerability", "malware", "ransomware", "data-breach", "apt",
  "zero-day", "supply-chain", "phishing", "insider-threat", "ddos",
];
const THREAT_LEVELS: ThreatLevel[] = ["critical", "high", "medium", "low"];
const INDUSTRIES: Industry[] = [
  "healthcare", "finance", "government", "energy", "retail",
  "technology", "education", "defense", "telecommunications", "manufacturing",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"articles" | "create" | "classify" | "ingest">("articles");

  // Create form state
  const [form, setForm] = useState({
    title: "", summary: "", content: "", threat_level: "medium" as ThreatLevel,
    category: "vulnerability" as Category, cves: "", affected_products: "",
    threat_actors: "", industries: [] as Industry[], attack_vector: "",
    source: "", source_url: "", tags: "", region: "Global", verified: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Classify state
  const [rawText, setRawText] = useState("");
  const [classifySource, setClassifySource] = useState("");
  const [classifyUrl, setClassifyUrl] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<Record<string, unknown> | null>(null);

  // Ingest state
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<Record<string, unknown> | null>(null);

  async function loadArticles() {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  }

  useEffect(() => { loadArticles(); }, []);

  async function deleteArticle(id: string) {
    await fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");

    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        slug: slugify(form.title),
        summary: form.summary,
        content: form.content,
        threat_level: form.threat_level,
        category: form.category,
        cves: form.cves.split(",").map((s) => s.trim()).filter(Boolean),
        affected_products: form.affected_products.split(",").map((s) => s.trim()).filter(Boolean),
        threat_actors: form.threat_actors.split(",").map((s) => s.trim()).filter(Boolean),
        industries: form.industries,
        attack_vector: form.attack_vector,
        source: form.source,
        source_url: form.source_url,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        region: form.region,
        verified: form.verified,
        verified_by: [],
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    const result = await res.json();

    setSaving(false);
    if (result.error) {
      setSaveMsg(`Error: ${result.error}`);
    } else {
      setSaveMsg("Article published successfully");
      setForm({
        title: "", summary: "", content: "", threat_level: "medium",
        category: "vulnerability", cves: "", affected_products: "",
        threat_actors: "", industries: [], attack_vector: "",
        source: "", source_url: "", tags: "", region: "Global", verified: false,
      });
      loadArticles();
    }
  }

  async function handleClassify() {
    setClassifying(true);
    setClassifyResult(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText,
          source: classifySource,
          source_url: classifyUrl,
        }),
      });
      const data = await res.json();
      setClassifyResult(data);
      if (data.success) {
        setRawText("");
        loadArticles();
      }
    } catch (err) {
      setClassifyResult({ error: "Request failed" });
    }
    setClassifying(false);
  }

  async function handleIngest() {
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      setIngestResult(data);
      if (data.total > 0) loadArticles();
    } catch (err) {
      setIngestResult({ error: "Request failed" });
    }
    setIngesting(false);
  }

  const tabs = [
    { id: "articles" as const, label: "Articles", icon: FileText, count: articles.length },
    { id: "create" as const, label: "Create", icon: Plus },
    { id: "classify" as const, label: "AI Classify", icon: Sparkles },
    { id: "ingest" as const, label: "Feed Ingest", icon: Download },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage intelligence articles</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadArticles} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {"count" in t && t.count !== undefined && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{t.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Articles List */}
      {tab === "articles" && (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No articles yet. Create one or run an ingest.
              </CardContent>
            </Card>
          ) : (
            articles.map((a) => (
              <Card key={a.id} className="hover:bg-accent/30 transition-colors">
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    <ThreatBadge level={a.threat_level} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium leading-tight line-clamp-1">{a.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{a.category}</span>
                      <span>&middot;</span>
                      <span>{formatDate(a.published_at)}</span>
                      <span>&middot;</span>
                      <span>{a.source}</span>
                      {a.cves.length > 0 && (
                        <>
                          <span>&middot;</span>
                          <span className="font-mono text-threat-high">{a.cves[0]}</span>
                        </>
                      )}
                      {a.verified && <CheckCircle className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteArticle(a.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Form */}
      {tab === "create" && (
        <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary *</label>
            <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Content *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threat Level</label>
              <select value={form.threat_level} onChange={(e) => setForm({ ...form, threat_level: e.target.value as ThreatLevel })}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {THREAT_LEVELS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVEs (comma-separated)</label>
              <Input value={form.cves} onChange={(e) => setForm({ ...form, cves: e.target.value })} placeholder="CVE-2026-1234, CVE-2026-5678" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affected Products</label>
              <Input value={form.affected_products} onChange={(e) => setForm({ ...form, affected_products: e.target.value })} placeholder="Product A, Product B" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threat Actors</label>
              <Input value={form.threat_actors} onChange={(e) => setForm({ ...form, threat_actors: e.target.value })} placeholder="APT29, LockBit" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attack Vector *</label>
              <Input value={form.attack_vector} onChange={(e) => setForm({ ...form, attack_vector: e.target.value })} required placeholder="Network / HTTP" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industries</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {INDUSTRIES.map((ind) => (
                <Badge
                  key={ind}
                  variant="outline"
                  className={`cursor-pointer text-xs capitalize transition-all ${
                    form.industries.includes(ind)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent"
                  }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      industries: form.industries.includes(ind)
                        ? form.industries.filter((i) => i !== ind)
                        : [...form.industries, ind],
                    })
                  }
                >
                  {ind}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source *</label>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required placeholder="CISA" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source URL</label>
              <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Region</label>
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags (comma-separated)</label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="zero-day, ransomware" className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="verified" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
            <label htmlFor="verified" className="text-sm">Mark as verified</label>
          </div>

          {saveMsg && (
            <div className={`text-sm ${saveMsg.startsWith("Error") ? "text-destructive" : "text-primary"}`}>
              {saveMsg}
            </div>
          )}

          <Button type="submit" disabled={saving} className="gap-1.5">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {saving ? "Publishing..." : "Publish Article"}
          </Button>
        </form>
      )}

      {/* AI Classify */}
      {tab === "classify" && (
        <div className="max-w-2xl space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">AI-Powered Classification</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste raw threat intelligence text. Claude will automatically classify it —
                extract CVEs, identify threat actors, assign severity, categorize, and publish as a structured article.
              </p>
            </CardContent>
          </Card>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raw Intelligence Text *</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste a security advisory, vendor bulletin, threat report, or news article here..."
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</label>
              <Input value={classifySource} onChange={(e) => setClassifySource(e.target.value)} placeholder="e.g. CISA Advisory" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source URL</label>
              <Input value={classifyUrl} onChange={(e) => setClassifyUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
          </div>

          <Button onClick={handleClassify} disabled={classifying || !rawText.trim()} className="gap-1.5">
            {classifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {classifying ? "Classifying..." : "Classify & Publish"}
          </Button>

          {classifyResult && (
            <Card className={classifyResult.success ? "border-primary/30" : "border-destructive/30"}>
              <CardContent className="p-4">
                {classifyResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle className="h-4 w-4" /> Article Published
                    </div>
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-48 bg-muted p-2 rounded">
                      {JSON.stringify(classifyResult.classification, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {String(classifyResult.error)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Feed Ingest */}
      {tab === "ingest" && (
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Feed Ingestion</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Pull latest vulnerabilities from CISA Known Exploited Vulnerabilities catalog
                and NIST NVD critical CVEs. Deduplicates automatically.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="text-xs">CISA KEV — Last 7 days</Badge>
                <Badge variant="outline" className="text-xs">NVD — Critical CVEs, last 3 days</Badge>
              </div>
              <Button onClick={handleIngest} disabled={ingesting} className="gap-1.5">
                {ingesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {ingesting ? "Ingesting..." : "Run Ingest Now"}
              </Button>
            </CardContent>
          </Card>

          {ingestResult && (
            <Card className={ingestResult.error ? "border-destructive/30" : "border-primary/30"}>
              <CardContent className="p-4">
                {ingestResult.error ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" /> {String(ingestResult.error)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CheckCircle className="h-4 w-4" /> Ingest Complete
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-mono font-bold text-primary">
                          {(ingestResult.ingested as Record<string, number>)?.cisa ?? 0}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CISA KEV</div>
                      </div>
                      <div>
                        <div className="text-2xl font-mono font-bold text-primary">
                          {(ingestResult.ingested as Record<string, number>)?.nvd ?? 0}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">NVD</div>
                      </div>
                      <div>
                        <div className="text-2xl font-mono font-bold text-primary">
                          {ingestResult.total as number}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total New</div>
                      </div>
                    </div>
                    {(ingestResult.errors as string[])?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {(ingestResult.errors as string[]).length} errors during ingest
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">Cron Setup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              To auto-ingest on a schedule, add to your <code className="bg-muted px-1 rounded">vercel.json</code>:
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto font-mono">
{`{
  "crons": [
    {
      "path": "/api/ingest",
      "schedule": "0 */6 * * *"
    }
  ]
}`}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              This runs every 6 hours. Set <code className="bg-muted px-1 rounded">INGEST_API_KEY</code> env var for auth.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
