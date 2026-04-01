import { RefreshCw } from "lucide-react";

export function FreshnessBadge({ latestPublishedAt }: { latestPublishedAt: string }) {
  const latest = new Date(latestPublishedAt);
  const now = new Date();
  const diffMs = now.getTime() - latest.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  let text: string;
  let color: string;

  if (diffMin < 5) {
    text = "Just now";
    color = "text-primary";
  } else if (diffMin < 60) {
    text = `${diffMin}m ago`;
    color = "text-primary";
  } else if (diffHours < 6) {
    text = `${diffHours}h ago`;
    color = "text-muted-foreground";
  } else if (diffHours < 24) {
    text = `${diffHours}h ago`;
    color = "text-threat-medium";
  } else {
    text = `${Math.floor(diffHours / 24)}d ago`;
    color = "text-threat-high";
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${color}`}>
      <RefreshCw className="h-2.5 w-2.5" />
      Last updated: {text}
    </span>
  );
}
