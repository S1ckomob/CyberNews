"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export function FreshnessBadge({ latestPublishedAt }: { latestPublishedAt: string }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("text-muted-foreground");

  useEffect(() => {
    function update() {
      const latest = new Date(latestPublishedAt);
      const now = new Date();
      const diffMs = now.getTime() - latest.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMin < 1) {
        setText("Just now");
        setColor("text-primary");
      } else if (diffMin < 60) {
        setText(`${diffMin}m ago`);
        setColor("text-primary");
      } else if (diffHours < 6) {
        setText(`${diffHours}h ago`);
        setColor("text-muted-foreground");
      } else if (diffHours < 24) {
        setText(`${diffHours}h ago`);
        setColor("text-threat-medium");
      } else {
        setText(`${Math.floor(diffHours / 24)}d ago`);
        setColor("text-threat-high");
      }
    }

    update();
    // Refresh every 30 seconds
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [latestPublishedAt]);

  if (!text) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${color}`}>
      <RefreshCw className="h-2.5 w-2.5" />
      Last updated: {text}
    </span>
  );
}
