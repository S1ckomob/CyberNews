"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, CheckCircle, Loader2 } from "lucide-react";

const STORAGE_KEY = "cyberintel-subscribed-email";

export function useIsSubscribed() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    setSubscribed(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  return subscribed;
}

export function markSubscribed(email: string) {
  localStorage.setItem(STORAGE_KEY, email);
}

export function SubscribeGate({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature: string;
}) {
  const subscribed = useIsSubscribed();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Still loading from localStorage
  if (subscribed === null) return null;

  if (subscribed) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        markSubscribed(email);
        setStatus("success");
        // Reload to show the content
        window.location.reload();
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to subscribe. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <Card className="border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            Subscribe to Access {feature}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
            Enter your email to unlock premium intelligence tools.
            You'll also receive our daily threat briefing — the same
            intel trusted by 15,000+ security professionals.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 max-w-xs mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="you@company.com"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="w-full gap-2" disabled={status === "loading"}>
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {status === "loading" ? "Subscribing..." : "Subscribe & Access"}
            </Button>
            {status === "error" && (
              <p className="text-xs text-destructive">{message}</p>
            )}
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Free forever</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> No spam</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Unsubscribe anytime</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
