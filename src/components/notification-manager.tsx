"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function NotificationManager() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    setMounted(true);
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
    setEnabled(localStorage.getItem("cyberintel-notifications") === "true");
  }, []);

  useEffect(() => {
    if (!enabled || !supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("notification-alerts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "articles" },
          (payload) => {
            const article = payload.new as {
              id: string;
              title: string;
              slug: string;
              threat_level: string;
              category: string;
            };

            // Only notify on critical, high, or zero-day
            const isUrgent =
              article.threat_level === "critical" ||
              article.threat_level === "high" ||
              article.category === "zero-day";

            if (!isUrgent) return;
            if (seenIds.current.has(article.id)) return;
            seenIds.current.add(article.id);

            const levelEmoji =
              article.threat_level === "critical" ? "🔴" :
              article.threat_level === "high" ? "🟠" : "🟡";

            if (Notification.permission === "granted") {
              const n = new Notification(
                `${levelEmoji} ${article.threat_level.toUpperCase()}: New Threat`,
                {
                  body: article.title,
                  icon: "/favicon.ico",
                  tag: article.id,
                }
              );
              n.onclick = () => {
                window.focus();
                window.location.href = `/article/${article.slug}`;
              };
            }
          }
        )
        .subscribe();
    } catch {
      // WebSocket may not be available in all environments
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [enabled]);

  async function toggleNotifications() {
    if (!("Notification" in window)) return;

    if (!enabled) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        setEnabled(true);
        localStorage.setItem("cyberintel-notifications", "true");
      }
    } else {
      setEnabled(false);
      localStorage.removeItem("cyberintel-notifications");
    }
  }

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleNotifications}
      className="gap-1.5 text-xs"
      title={enabled ? "Disable threat alerts" : "Enable threat alerts"}
    >
      {enabled ? (
        <Bell className="h-3.5 w-3.5 text-primary" />
      ) : (
        <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className="hidden sm:inline">
        {enabled ? "Alerts On" : "Alerts"}
      </span>
    </Button>
  );
}
