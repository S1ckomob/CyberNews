import Link from "next/link";
import type { ThreatActor, Article } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActorNode {
  actor: ThreatActor;
  x: number;
  y: number;
  articles: number;
  connections: { targetId: string; reason: string }[];
}

const ORIGIN_COLORS: Record<string, string> = {
  "Russia": "#dc2626",
  "China": "#ea580c",
  "North Korea": "#ca8a04",
  "Iran": "#22c55e",
  "United States": "#3b82f6",
  "United Kingdom": "#3b82f6",
  "Unknown": "#6b7280",
};

function getOriginColor(origin: string): string {
  for (const [key, color] of Object.entries(ORIGIN_COLORS)) {
    if (origin.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#6b7280";
}

export function ActorGraph({ actors, articles }: { actors: ThreatActor[]; articles: Article[] }) {
  // Build nodes with positions (circular layout)
  const centerX = 400;
  const centerY = 250;
  const radius = 180;

  const nodes: ActorNode[] = actors.slice(0, 12).map((actor, i) => {
    const angle = (i / Math.min(actors.length, 12)) * Math.PI * 2 - Math.PI / 2;
    const articleCount = articles.filter((a) =>
      a.threatActors.some((t) => t === actor.name || actor.aliases.includes(t))
    ).length;

    return {
      actor,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      articles: articleCount,
      connections: [],
    };
  });

  // Find connections: actors linked by shared CVEs, products, or industries
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].actor;
      const b = nodes[j].actor;

      // Same origin country
      if (a.origin === b.origin && a.origin !== "Unknown") {
        nodes[i].connections.push({ targetId: b.id, reason: `Same origin: ${a.origin}` });
        nodes[j].connections.push({ targetId: a.id, reason: `Same origin: ${b.origin}` });
      }

      // Shared target industries
      const sharedIndustries = a.targetIndustries.filter((ind) => b.targetIndustries.includes(ind));
      if (sharedIndustries.length >= 2) {
        nodes[i].connections.push({ targetId: b.id, reason: `Shared targets: ${sharedIndustries.slice(0, 2).join(", ")}` });
        nodes[j].connections.push({ targetId: a.id, reason: `Shared targets: ${sharedIndustries.slice(0, 2).join(", ")}` });
      }

      // Shared TTPs
      const sharedTTPs = a.ttps.filter((t) =>
        b.ttps.some((bt) => bt.toLowerCase().includes(t.toLowerCase().split(" ")[0]))
      );
      if (sharedTTPs.length >= 2) {
        nodes[i].connections.push({ targetId: b.id, reason: `Shared TTPs` });
        nodes[j].connections.push({ targetId: a.id, reason: `Shared TTPs` });
      }
    }
  }

  // Deduplicate connections
  for (const node of nodes) {
    const seen = new Set<string>();
    node.connections = node.connections.filter((c) => {
      if (seen.has(c.targetId)) return false;
      seen.add(c.targetId);
      return true;
    });
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 800 500" className="w-full h-auto">
        {/* Connection lines */}
        {nodes.map((node) =>
          node.connections.map((conn) => {
            const target = nodes.find((n) => n.actor.id === conn.targetId);
            if (!target) return null;
            // Only draw from lower index to avoid duplicates
            const nodeIdx = nodes.indexOf(node);
            const targetIdx = nodes.indexOf(target);
            if (nodeIdx > targetIdx) return null;

            return (
              <line
                key={`${node.actor.id}-${conn.targetId}`}
                x1={node.x} y1={node.y}
                x2={target.x} y2={target.y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeOpacity="0.1"
                strokeDasharray="4 4"
              />
            );
          })
        )}

        {/* Nodes */}
        {nodes.map((node) => {
          const color = getOriginColor(node.actor.origin);
          const nodeRadius = Math.min(8 + node.articles * 2, 20);

          return (
            <Link key={node.actor.id} href={`/threat-actors/${node.actor.id}`}>
              <g className="cursor-pointer">
                {/* Glow */}
                <circle cx={node.x} cy={node.y} r={nodeRadius + 4}
                  fill={color} opacity="0.1" />
                {/* Main */}
                <circle cx={node.x} cy={node.y} r={nodeRadius}
                  fill={color} opacity="0.7"
                  stroke={color} strokeWidth="1" strokeOpacity="0.3" />
                {/* Label */}
                <text
                  x={node.x} y={node.y + nodeRadius + 14}
                  textAnchor="middle" fill="currentColor"
                  fontSize="9" fontWeight="600" opacity="0.6"
                >
                  {node.actor.name}
                </text>
                {/* Origin label */}
                <text
                  x={node.x} y={node.y + nodeRadius + 24}
                  textAnchor="middle" fill="currentColor"
                  fontSize="7" opacity="0.3" fontFamily="monospace"
                >
                  {node.actor.origin.split(" / ")[0]}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground justify-center">
        {Object.entries(ORIGIN_COLORS).filter(([k]) => k !== "Unknown").map(([origin, color]) => (
          <span key={origin} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {origin}
          </span>
        ))}
        <span className="text-muted-foreground/40">— dashed lines = shared targets/TTPs</span>
      </div>
    </div>
  );
}
