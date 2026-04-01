"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Search, Hash, Globe, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface IOC {
  type: "hash-md5" | "hash-sha1" | "hash-sha256" | "ipv4" | "domain" | "url" | "cve" | "email";
  value: string;
}

const IOC_PATTERNS: { type: IOC["type"]; regex: RegExp; label: string; icon: typeof Hash }[] = [
  { type: "hash-sha256", regex: /\b[a-fA-F0-9]{64}\b/g, label: "SHA-256", icon: Hash },
  { type: "hash-sha1", regex: /\b[a-fA-F0-9]{40}\b/g, label: "SHA-1", icon: Hash },
  { type: "hash-md5", regex: /\b[a-fA-F0-9]{32}\b/g, label: "MD5", icon: Hash },
  { type: "cve", regex: /CVE-\d{4}-\d{4,}/g, label: "CVE", icon: Search },
  { type: "ipv4", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, label: "IPv4", icon: Globe },
  { type: "url", regex: /https?:\/\/[^\s"'<>]+/g, label: "URL", icon: Link2 },
  { type: "domain", regex: /\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|ru|cn|xyz|top|info|tk|cc|pw|biz)\b/g, label: "Domain", icon: Globe },
  { type: "email", regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, label: "Email", icon: Globe },
];

// Known benign domains to exclude
const EXCLUDE_DOMAINS = [
  "github.com", "microsoft.com", "google.com", "cisa.gov", "nist.gov",
  "vercel.app", "supabase.co", "nextjs.org", "fortinet.com", "cisco.com",
  "paloaltonetworks.com", "sonicwall.com", "ivanti.com", "apple.com",
  "mandiant.com", "crowdstrike.com", "bleepingcomputer.com",
];

function extractIOCs(text: string): IOC[] {
  const iocs: IOC[] = [];
  const seen = new Set<string>();

  for (const pattern of IOC_PATTERNS) {
    const matches = text.match(pattern.regex) || [];
    for (const match of matches) {
      const value = match.toLowerCase();

      if (seen.has(value)) continue;
      seen.add(value);

      // Skip known benign
      if (pattern.type === "domain" && EXCLUDE_DOMAINS.some((d) => value.includes(d))) continue;
      if (pattern.type === "url" && EXCLUDE_DOMAINS.some((d) => value.includes(d))) continue;

      // Skip IPs that look like version numbers (e.g. 7.0.0.1)
      if (pattern.type === "ipv4") {
        const parts = value.split(".").map(Number);
        if (parts.some((p) => p > 255)) continue;
        if (value === "0.0.0.0" || value === "127.0.0.1") continue;
      }

      iocs.push({ type: pattern.type, value: match });
    }
  }

  return iocs;
}

const ANALYSIS_TOOLS: {
  name: string;
  types: IOC["type"][];
  url: (value: string, type: IOC["type"]) => string;
}[] = [
  {
    name: "VirusTotal",
    types: ["hash-md5", "hash-sha1", "hash-sha256", "domain", "ipv4", "url"],
    url: (v, t) => {
      if (t.startsWith("hash")) return `https://www.virustotal.com/gui/file/${v}`;
      if (t === "domain") return `https://www.virustotal.com/gui/domain/${v}`;
      if (t === "ipv4") return `https://www.virustotal.com/gui/ip-address/${v}`;
      return `https://www.virustotal.com/gui/url/${encodeURIComponent(v)}`;
    },
  },
  {
    name: "AnyRun",
    types: ["hash-md5", "hash-sha1", "hash-sha256"],
    url: (v) => `https://app.any.run/submissions/#filehash:${v}`,
  },
  {
    name: "Shodan",
    types: ["ipv4"],
    url: (v) => `https://www.shodan.io/host/${v}`,
  },
  {
    name: "NVD",
    types: ["cve"],
    url: (v) => `https://nvd.nist.gov/vuln/detail/${v}`,
  },
  {
    name: "MITRE CVE",
    types: ["cve"],
    url: (v) => `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${v}`,
  },
  {
    name: "AbuseIPDB",
    types: ["ipv4"],
    url: (v) => `https://www.abuseipdb.com/check/${v}`,
  },
  {
    name: "URLhaus",
    types: ["url", "domain"],
    url: (v) => `https://urlhaus.abuse.ch/browse.php?search=${encodeURIComponent(v)}`,
  },
  {
    name: "Joe Sandbox",
    types: ["hash-md5", "hash-sha1", "hash-sha256"],
    url: (v) => `https://www.joesandbox.com/search?q=${v}`,
  },
  {
    name: "Hybrid Analysis",
    types: ["hash-md5", "hash-sha1", "hash-sha256"],
    url: (v) => `https://www.hybrid-analysis.com/search?query=${v}`,
  },
];

export function IOCPanel({ content, cves }: { content: string; cves: string[] }) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const iocs = useMemo(() => {
    // Add CVEs from article metadata too
    const fullText = content + " " + cves.join(" ");
    return extractIOCs(fullText);
  }, [content, cves]);

  if (iocs.length === 0) return null;

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 1500);
  }

  async function copyAll() {
    const text = iocs.map((i) => `${i.type}\t${i.value}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedValue("__all__");
    setTimeout(() => setCopiedValue(null), 1500);
  }

  const grouped = iocs.reduce<Record<string, IOC[]>>((acc, ioc) => {
    const label = IOC_PATTERNS.find((p) => p.type === ioc.type)?.label || ioc.type;
    if (!acc[label]) acc[label] = [];
    acc[label].push(ioc);
    return acc;
  }, {});

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Indicators of Compromise ({iocs.length})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] h-6 gap-1"
            onClick={copyAll}
          >
            {copiedValue === "__all__" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            {copiedValue === "__all__" ? "Copied" : "Copy All"}
          </Button>
        </div>

        <div className="space-y-3">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {label} ({items.length})
              </div>
              <div className="space-y-1">
                {items.map((ioc) => {
                  const tools = ANALYSIS_TOOLS.filter((t) => t.types.includes(ioc.type));
                  return (
                    <div
                      key={ioc.value}
                      className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1.5 group"
                    >
                      <code className="flex-1 font-mono text-[11px] text-foreground break-all">
                        {ioc.value}
                      </code>
                      <div className="flex items-center gap-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(ioc.value)}
                          className="rounded p-0.5 hover:bg-accent transition-colors"
                          title="Copy"
                        >
                          {copiedValue === ioc.value ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                        {tools.slice(0, 3).map((tool) => (
                          <a
                            key={tool.name}
                            href={tool.url(ioc.value, ioc.type)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded px-1 py-0.5 text-[9px] font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                            title={`Analyze on ${tool.name}`}
                          >
                            {tool.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
