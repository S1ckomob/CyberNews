import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ThreatLevel } from "@/lib/types";

const threatConfig: Record<
  ThreatLevel,
  { label: string; className: string }
> = {
  critical: {
    label: "CRITICAL",
    className:
      "bg-threat-critical/15 text-threat-critical border-threat-critical/30 hover:bg-threat-critical/20",
  },
  high: {
    label: "HIGH",
    className:
      "bg-threat-high/15 text-threat-high border-threat-high/30 hover:bg-threat-high/20",
  },
  medium: {
    label: "MEDIUM",
    className:
      "bg-threat-medium/15 text-threat-medium border-threat-medium/30 hover:bg-threat-medium/20",
  },
  low: {
    label: "LOW",
    className:
      "bg-threat-low/15 text-threat-low border-threat-low/30 hover:bg-threat-low/20",
  },
};

interface ThreatBadgeProps {
  level: ThreatLevel;
  size?: "sm" | "default";
  pulse?: boolean;
  className?: string;
}

export function ThreatBadge({
  level,
  size = "default",
  pulse = false,
  className,
}: ThreatBadgeProps) {
  const config = threatConfig[level];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono font-semibold tracking-wider",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        config.className,
        pulse && level === "critical" && "animate-threat-pulse",
        className
      )}
    >
      {pulse && level === "critical" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-threat-critical animate-threat-pulse" />
      )}
      {config.label}
    </Badge>
  );
}
