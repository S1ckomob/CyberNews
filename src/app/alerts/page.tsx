"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThreatBadge } from "@/components/threat-badge";
import type { ThreatLevel } from "@/lib/types";
import { csrfHeaders } from "@/lib/csrf-client";
import {
  Bell, Plus, X, CheckCircle, Loader2, Mail,
  Shield, Users, Box, AlertTriangle, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_OPTIONS: ThreatLevel[] = ["critical", "high", "medium", "low"];

const CATEGORY_OPTIONS = [
  { value: "vulnerability", label: "Vulnerabilities" },
  { value: "malware", label: "Malware" },
  { value: "ransomware", label: "Ransomware" },
  { value: "data-breach", label: "Data Breach" },
  { value: "apt", label: "APT" },
  { value: "zero-day", label: "Zero-Day" },
  { value: "supply-chain", label: "Supply Chain" },
  { value: "phishing", label: "Phishing" },
  { value: "insider-threat", label: "Insider Threat" },
  { value: "ddos", label: "DDoS" },
  { value: "ai", label: "AI / ML" },
];

const SUGGESTED_PRODUCTS = [
  "FortiGate", "FortiOS", "FortiManager", "PAN-OS", "GlobalProtect",
  "Cisco ASA", "Cisco IOS", "SonicWall", "Ivanti Connect Secure",
  "Windows Server", "Windows 11", "Active Directory",
  "Microsoft Exchange", "Microsoft 365", "Azure AD",
  "VMware ESXi", "vCenter Server", "Linux Kernel",
  "Google Chrome", "Jenkins", "WordPress", "Apache",
];

import { SUGGESTED_ACTORS } from "@/lib/threat-actors-list";

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string[]>(["critical", "high"]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState("");
  const [newActor, setNewActor] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("cyberintel-alert-email");
    if (savedEmail) {
      setEmail(savedEmail);
      // Load existing rules
      fetch(`/api/alerts?email=${encodeURIComponent(savedEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.rules) {
            setProducts(data.rules.products || []);
            setActors(data.rules.actors || []);
            setSeverity(data.rules.severity || ["critical", "high"]);
            setCategories(data.rules.categories || []);
          }
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, []);

  function addProduct(name: string) {
    if (!name.trim() || products.includes(name.trim())) return;
    setProducts([...products, name.trim()]);
    setNewProduct("");
  }

  function addActor(name: string) {
    if (!name.trim() || actors.includes(name.trim())) return;
    setActors([...actors, name.trim()]);
    setNewActor("");
  }

  function toggleSeverity(level: string) {
    setSeverity(
      severity.includes(level)
        ? severity.filter((s) => s !== level)
        : [...severity, level]
    );
  }

  function toggleCategory(cat: string) {
    setCategories(
      categories.includes(cat)
        ? categories.filter((c) => c !== cat)
        : [...categories, cat]
    );
  }

  async function handleSave() {
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Enter a valid email address");
      return;
    }
    if (severity.length === 0) {
      setStatus("error");
      setMessage("Select at least one severity level");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: csrfHeaders(),
        body: JSON.stringify({ email, products, actors, severity, categories }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("cyberintel-alert-email", email);
        setStatus("saved");
        setMessage("Alert rules saved! You'll receive emails when matching threats are detected.");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to save. Try again.");
    }
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Alert Settings</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Get email alerts when new threats match your criteria. Alerts fire every 5 minutes when new intel is ingested.
      </p>

      {/* Email */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Email Address</h3>
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="you@company.com"
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Severity */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-threat-critical" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Severity Levels
            </h3>
            <span className="text-[10px] text-muted-foreground">(select which levels trigger alerts)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_OPTIONS.map((level) => (
              <button
                key={level}
                onClick={() => toggleSeverity(level)}
                className={cn(
                  "transition-opacity",
                  severity.length > 0 && !severity.includes(level) && "opacity-30"
                )}
              >
                <ThreatBadge level={level} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Categories
            </h3>
            <span className="text-[10px] text-muted-foreground">(none selected = all categories)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map((cat) => (
              <Badge
                key={cat.value}
                variant="outline"
                className={cn(
                  "cursor-pointer text-xs transition-all",
                  categories.includes(cat.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent"
                )}
                onClick={() => toggleCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Box className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Products to Monitor
            </h3>
            <span className="text-[10px] text-muted-foreground">(optional — leave empty to match all)</span>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              placeholder="e.g. FortiGate"
              className="text-sm h-8 max-w-xs"
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
                  <button onClick={() => setProducts(products.filter((x) => x !== p))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_PRODUCTS.filter((p) => !products.includes(p)).slice(0, 10).map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] cursor-pointer hover:bg-accent"
                onClick={() => addProduct(p)}>
                + {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actors */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-threat-high" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Threat Actors to Monitor
            </h3>
            <span className="text-[10px] text-muted-foreground">(optional)</span>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              value={newActor}
              onChange={(e) => setNewActor(e.target.value)}
              placeholder="e.g. APT29"
              className="text-sm h-8 max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && addActor(newActor)}
            />
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addActor(newActor)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {actors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {actors.map((a) => (
                <Badge key={a} variant="secondary" className="text-xs gap-1 pr-1">
                  {a}
                  <button onClick={() => setActors(actors.filter((x) => x !== a))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_ACTORS.filter((a) => !actors.includes(a)).slice(0, 8).map((a) => (
              <Badge key={a} variant="outline" className="text-[10px] cursor-pointer hover:bg-accent"
                onClick={() => addActor(a)}>
                + {a}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Summary */}
      <Card className="mb-4 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Alert Summary</h3>
          <p className="text-sm text-muted-foreground">
            You'll receive an email when a new article matches:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-primary" />
              Severity: {severity.length > 0 ? severity.map((s) => s.toUpperCase()).join(", ") : "None selected"}
            </li>
            {categories.length > 0 && (
              <li className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-primary" />
                Categories: {categories.map((c) => c.replace("-", " ")).join(", ")}
              </li>
            )}
            {products.length > 0 && (
              <li className="flex items-center gap-2">
                <Box className="h-3 w-3 text-primary" />
                Products: {products.join(", ")}
              </li>
            )}
            {actors.length > 0 && (
              <li className="flex items-center gap-2">
                <Users className="h-3 w-3 text-primary" />
                Actors: {actors.join(", ")}
              </li>
            )}
            {categories.length === 0 && products.length === 0 && actors.length === 0 && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <Box className="h-3 w-3" />
                All {severity.join("/")} threats (no category/product/actor filter)
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={status === "loading"} className="gap-2">
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "saved" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {status === "loading" ? "Saving..." : status === "saved" ? "Saved!" : "Save Alert Rules"}
        </Button>
        {(status === "saved" || status === "error") && (
          <p className={cn("text-sm", status === "saved" ? "text-primary" : "text-destructive")}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
