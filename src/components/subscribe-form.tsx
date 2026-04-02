"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf-client";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "vulnerability", label: "Vulnerabilities" },
  { value: "malware", label: "Malware" },
  { value: "ransomware", label: "Ransomware" },
  { value: "data-breach", label: "Data Breach" },
  { value: "apt", label: "APT" },
  { value: "zero-day", label: "Zero-Day" },
  { value: "supply-chain", label: "Supply Chain" },
  { value: "phishing", label: "Phishing" },
] as const;

const SEVERITIES = [
  { value: "critical", label: "Critical", color: "text-threat-critical" },
  { value: "high", label: "High", color: "text-threat-high" },
  { value: "medium", label: "Medium", color: "text-threat-medium" },
  { value: "low", label: "Low", color: "text-threat-low" },
] as const;

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPrefs, setShowPrefs] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string[]>(["critical", "high"]);

  function toggleCategory(val: string) {
    setCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  }

  function toggleSeverity(val: string) {
    setSeverity((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: csrfHeaders(),
        body: JSON.stringify({
          email,
          ...(categories.length > 0 && { categories }),
          ...(severity.length > 0 && severity.length < 4 && { severity }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to subscribe. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
        <CheckCircle className="h-4 w-4" />
        {message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="security@company.com"
          required
          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" size="sm" className="text-xs" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Subscribe"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setShowPrefs(!showPrefs)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn("h-3 w-3 transition-transform", showPrefs && "rotate-180")} />
        Customize what you receive
      </button>

      {showPrefs && (
        <div className="rounded-md border border-border p-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Severity levels
            </p>
            <div className="flex flex-wrap gap-1">
              {SEVERITIES.map((s) => (
                <Badge
                  key={s.value}
                  variant="outline"
                  className={cn(
                    "text-[10px] cursor-pointer transition-all",
                    severity.includes(s.value)
                      ? `bg-primary/10 border-primary/30 ${s.color}`
                      : "opacity-40 hover:opacity-70"
                  )}
                  onClick={() => toggleSeverity(s.value)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Categories <span className="font-normal">(none = all)</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c.value}
                  variant="outline"
                  className={cn(
                    "text-[10px] cursor-pointer transition-all",
                    categories.includes(c.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent"
                  )}
                  onClick={() => toggleCategory(c.value)}
                >
                  {c.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-destructive">{message}</p>
      )}
    </div>
  );
}
