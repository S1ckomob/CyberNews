"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, Loader2, Shield, Bell, Zap,
  Bug, Lock, Globe, Monitor, Mail, Target,
  Server, Search, X, Brain,
} from "lucide-react";
import { csrfHeaders } from "@/lib/csrf-client";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "zero-day", label: "Zero-Day", icon: Bug, color: "text-threat-critical" },
  { value: "ransomware", label: "Ransomware", icon: Lock, color: "text-threat-high" },
  { value: "vulnerability", label: "CVE / Vuln", icon: Shield, color: "text-threat-medium" },
  { value: "apt", label: "APT / Nation-State", icon: Globe, color: "text-threat-high" },
  { value: "data-breach", label: "Data Breach", icon: Target, color: "text-threat-high" },
  { value: "malware", label: "Malware", icon: Monitor, color: "text-threat-medium" },
  { value: "supply-chain", label: "Supply Chain", icon: Zap, color: "text-threat-medium" },
  { value: "phishing", label: "Phishing", icon: Mail, color: "text-muted-foreground" },
  { value: "ai", label: "AI / ML", icon: Brain, color: "text-threat-medium" },
] as const;

const SEVERITIES = [
  { value: "critical", label: "Critical", dot: "bg-threat-critical" },
  { value: "high", label: "High", dot: "bg-threat-high" },
  { value: "medium", label: "Medium", dot: "bg-threat-medium" },
  { value: "low", label: "Low", dot: "bg-threat-low" },
] as const;

const VENDOR_GROUPS = [
  {
    label: "Network / Firewall",
    vendors: ["Fortinet", "Palo Alto", "Cisco", "SonicWall", "Ivanti", "Juniper", "Check Point", "F5"],
  },
  {
    label: "Cloud / Identity",
    vendors: ["Microsoft Azure", "AWS", "Google Cloud", "Okta", "CrowdStrike", "Cloudflare"],
  },
  {
    label: "Endpoint / OS",
    vendors: ["Microsoft Windows", "Linux", "VMware", "Apple", "Android"],
  },
  {
    label: "Applications",
    vendors: ["Microsoft 365", "Salesforce", "SAP", "Oracle", "WordPress", "Apache"],
  },
] as const;

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "customizing" | "loading" | "success" | "error">("idle");
  const isLoading = status === "loading";
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string[]>(["critical", "high"]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");

  function toggle<T extends string>(arr: T[], val: T, setter: (v: T[]) => void) {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }

  async function handleSubmit() {
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
          ...(vendors.length > 0 && { products: vendors }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage("You're in. Alerts will arrive within minutes of detection.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Connection failed. Try again.");
    }
  }

  // Success state
  if (status === "success") {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle className="h-4 w-4" />
          Subscribed
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{message}</p>
      </div>
    );
  }

  // Customization step
  if (status === "customizing") {
    const filteredGroups = VENDOR_GROUPS.map((g) => ({
      ...g,
      vendors: g.vendors.filter((v) =>
        !vendorSearch || v.toLowerCase().includes(vendorSearch.toLowerCase())
      ),
    })).filter((g) => g.vendors.length > 0);

    return (
      <div className="space-y-3">
        {/* Severity */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Alert me for
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                onClick={() => toggle(severity, s.value, setSeverity)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                  severity.includes(s.value)
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/50 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, !severity.includes(s.value) && "opacity-30")} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Threat types <span className="font-normal opacity-60">optional</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = categories.includes(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggle(categories, c.value, setCategories)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-medium transition-all text-left",
                    active
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/50 text-muted-foreground/60 hover:border-border hover:text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-3 w-3 shrink-0", active ? c.color : "text-muted-foreground/40")} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vendors */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            <Server className="h-3 w-3 inline-block mr-1 -mt-0.5" />
            Vendors in your stack <span className="font-normal opacity-60">optional</span>
          </p>

          {/* Selected vendors */}
          {vendors.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {vendors.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  {v}
                  <button onClick={() => setVendors(vendors.filter((x) => x !== v))} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
            <Input
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="Search vendors..."
              className="h-7 pl-7 text-[11px] bg-background"
            />
          </div>

          {/* Vendor grid by group */}
          <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border border-border/50 p-2">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {group.vendors.map((v) => {
                    const active = vendors.includes(v);
                    return (
                      <button
                        key={v}
                        onClick={() => toggle(vendors, v, setVendors)}
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-all",
                          active
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/40 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <p className="text-[10px] text-muted-foreground/50 text-center py-2">No vendors match "{vendorSearch}"</p>
            )}
          </div>
        </div>

        {/* Summary + Submit */}
        <div className="rounded-md bg-card/80 border border-border/50 p-2.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">{email}</span> — {" "}
            <span className="font-semibold text-foreground">
              {severity.length === 4 ? "all" : severity.join(" + ")}
            </span>
            {" "}severity
            {categories.length > 0 && (
              <> · {categories.length} {categories.length === 1 ? "category" : "categories"}</>
            )}
            {vendors.length > 0 && (
              <> · {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}</>
            )}
            {categories.length === 0 && vendors.length === 0 && (
              <> · all threats</>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Bell className="h-3 w-3" />
            )}
            Activate Alerts
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => setStatus("idle")}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Default email entry
  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email) return;
          setStatus("customizing");
        }}
        className="space-y-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="security@company.com"
          required
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        />
        <Button type="submit" size="sm" className="w-full text-xs gap-1.5">
          <Shield className="h-3 w-3" />
          Subscribe
        </Button>
      </form>

      {status === "error" && (
        <p className="text-[10px] text-destructive">{message}</p>
      )}
    </div>
  );
}
