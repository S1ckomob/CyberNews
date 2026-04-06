"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export function FreshnessBadge() {
  const [mountTime] = useState(() => new Date());
  const [text, setText] = useState("");
  const [color, setColor] = useState("text-primary");

  useEffect(() => {
    function update() {
      const now = new Date();
      const diffMs = now.getTime() - mountTime.getTime();
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
      } else {
        setText(`${diffHours}h ago`);
        setColor("text-threat-medium");
      }
    }

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [mountTime]);

  if (!text) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${color}`}>
      <RefreshCw className="h-2.5 w-2.5" />
      Updated: {text}
    </span>
  );
}
