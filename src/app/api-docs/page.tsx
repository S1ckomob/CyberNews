import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Code, Globe, Key, Zap, FileText, Search, Users, Lock } from "lucide-react";

export const metadata = {
  title: "API Documentation",
  description: "Security Intel Hub REST API for programmatic access to threat intelligence data.",
};

const endpoints = [
  {
    method: "GET",
    path: "/feed.xml",
    description: "RSS 2.0 feed of the latest 50 articles. Subscribe in any RSS reader, SIEM, or Slack RSS bot.",
    auth: false,
    params: [],
    example: `curl https://your-site.vercel.app/feed.xml`,
  },
  {
    method: "GET",
    path: "/api/search?q={query}",
    description: "Search articles, CVEs, and threat actors. Returns grouped results.",
    auth: false,
    params: [
      { name: "q", type: "string", required: true, description: "Search query (min 2 chars)" },
    ],
    example: `curl "https://your-site.vercel.app/api/search?q=fortinet"`,
    response: `{
  "articles": [{ "title": "...", "slug": "...", "threat_level": "critical", "source": "..." }],
  "actors": [{ "id": "unc3886", "name": "UNC3886", "origin": "China" }],
  "cves": [{ "cve": "CVE-2026-48788", "articleTitle": "...", "slug": "..." }]
}`,
  },
  {
    method: "POST",
    path: "/api/ingest",
    description: "Trigger feed ingestion from all 10+ sources. Deduplicates automatically. Sends Slack alerts for critical/zero-day articles.",
    auth: true,
    params: [],
    example: `curl -X POST https://your-site.vercel.app/api/ingest \\
  -H "Authorization: Bearer YOUR_INGEST_API_KEY"`,
    response: `{
  "success": true,
  "ingested": { "BleepingComputer": 5, "CISA KEV": 2, "NIST NVD": 8 },
  "total": 15,
  "sources_checked": 10,
  "errors": []
}`,
  },
  {
    method: "POST",
    path: "/api/classify",
    description: "Submit raw threat intelligence text. Claude AI classifies it (severity, category, CVEs, actors, industries) and publishes as a structured article.",
    auth: true,
    params: [
      { name: "raw_text", type: "string", required: true, description: "Raw threat intel text to classify" },
      { name: "source", type: "string", required: false, description: "Source name (default: Manual Submission)" },
      { name: "source_url", type: "string", required: false, description: "URL of original source" },
    ],
    example: `curl -X POST https://your-site.vercel.app/api/classify \\
  -H "Authorization: Bearer YOUR_INGEST_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"raw_text": "Fortinet has disclosed a critical...", "source": "Fortinet PSIRT"}'`,
    response: `{
  "success": true,
  "article": { "id": "...", "slug": "fortinet-critical-rce-..." },
  "classification": {
    "threat_level": "critical",
    "category": "vulnerability",
    "cves": ["CVE-2026-48788"],
    "threat_actors": ["UNC3886"],
    "industries": ["government", "finance"]
  }
}`,
  },
  {
    method: "POST",
    path: "/api/subscribe",
    description: "Subscribe an email to the daily threat briefing newsletter.",
    auth: false,
    params: [
      { name: "email", type: "string", required: true, description: "Email address to subscribe" },
    ],
    example: `curl -X POST https://your-site.vercel.app/api/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{"email": "soc@company.com"}'`,
    response: `{ "success": true, "message": "Subscribed to daily briefing" }`,
  },
  {
    method: "POST",
    path: "/api/digest",
    description: "Trigger sending of daily email digest to all active subscribers. Includes articles from the last 24 hours.",
    auth: true,
    params: [],
    example: `curl -X POST https://your-site.vercel.app/api/digest \\
  -H "Authorization: Bearer YOUR_INGEST_API_KEY"`,
  },
];

export default function APIDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Code className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Programmatic access to Security Intel Hub threat intelligence. Integrate with your SIEM, SOAR, Slack, or custom tools.
      </p>

      {/* Quick Start */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-foreground">RSS Feed:</strong> Subscribe to <code className="bg-muted px-1 rounded">/feed.xml</code> in any RSS reader for the latest 50 articles.</p>
            <p><strong className="text-foreground">Search:</strong> <code className="bg-muted px-1 rounded">GET /api/search?q=ransomware</code> — no auth needed.</p>
            <p><strong className="text-foreground">Ingest:</strong> <code className="bg-muted px-1 rounded">POST /api/ingest</code> with <code className="bg-muted px-1 rounded">Authorization: Bearer KEY</code> to pull fresh articles.</p>
          </div>
        </CardContent>
      </Card>

      {/* Auth */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Authentication</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Public endpoints (search, subscribe, RSS) require no authentication. Write endpoints (ingest, classify, digest) require a Bearer token.
          </p>
          <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-auto">
{`Authorization: Bearer YOUR_INGEST_API_KEY`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Set <code className="bg-muted px-1 rounded">INGEST_API_KEY</code> as an environment variable on your deployment.
          </p>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Endpoints */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Endpoints</h2>
      <div className="space-y-4">
        {endpoints.map((ep) => (
          <Card key={ep.path} id={ep.path.replace(/[^a-z]/g, "-")}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={ep.method === "GET" ? "bg-primary text-primary-foreground" : "bg-threat-high text-white"}>
                  {ep.method}
                </Badge>
                <code className="font-mono text-sm font-bold">{ep.path}</code>
                {ep.auth && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Lock className="h-2.5 w-2.5" /> Auth
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {ep.description}
              </p>

              {ep.params.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Parameters</h4>
                  <div className="space-y-1">
                    {ep.params.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-xs">
                        <code className="font-mono text-primary">{p.name}</code>
                        <span className="text-muted-foreground/50">{p.type}</span>
                        {p.required && <Badge variant="outline" className="text-[9px] h-4">required</Badge>}
                        <span className="text-muted-foreground">{p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Example</h4>
                <pre className="bg-muted rounded-md p-3 text-[11px] font-mono overflow-auto whitespace-pre-wrap">
                  {ep.example}
                </pre>
              </div>

              {ep.response && (
                <div className="mt-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Response</h4>
                  <pre className="bg-muted rounded-md p-3 text-[11px] font-mono overflow-auto">
                    {ep.response}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Rate Limits + Sources */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Data Sources</h3>
            <div className="flex flex-wrap gap-1.5">
              {["CISA KEV", "NIST NVD", "BleepingComputer", "The Hacker News", "Krebs on Security", "Dark Reading", "SecurityWeek", "CyberScoop", "The Record", "Threatpost"].map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Integrations</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Slack:</strong> Set <code className="bg-muted px-1 rounded text-[10px]">SLACK_WEBHOOK_URL</code> for automatic critical threat alerts.<br />
              <strong>Email:</strong> Set <code className="bg-muted px-1 rounded text-[10px]">RESEND_API_KEY</code> for daily digest emails.<br />
              <strong>Cron:</strong> External cron hits <code className="bg-muted px-1 rounded text-[10px]">GET /api/ingest-cron</code> with <code className="bg-muted px-1 rounded text-[10px]">Authorization: Bearer KEY</code> every 5 min.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
