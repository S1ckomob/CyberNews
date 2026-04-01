import { MITRE_TACTICS, mapTtpsToTactics } from "@/lib/mitre-attack";
import { cn } from "@/lib/utils";

export function MitreAttackGrid({ ttps }: { ttps: string[] }) {
  const activeTactics = mapTtpsToTactics(ttps);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        MITRE ATT&CK Coverage
      </h3>
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-7 lg:grid-cols-14">
        {MITRE_TACTICS.map((tactic) => {
          const active = activeTactics.has(tactic.id);
          return (
            <div
              key={tactic.id}
              className={cn(
                "rounded-md border p-1.5 text-center transition-colors",
                active
                  ? "bg-threat-high/15 border-threat-high/40 text-threat-high"
                  : "bg-muted/20 border-transparent text-muted-foreground/40"
              )}
              title={tactic.name}
            >
              {active && <span className="block h-1 w-1 rounded-full bg-threat-high mx-auto mb-1" />}
              <span className="text-[8px] font-semibold leading-tight block">
                {tactic.short}
              </span>
            </div>
          );
        })}
      </div>
      {activeTactics.size > 0 && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          {activeTactics.size} of {MITRE_TACTICS.length} tactics observed
        </div>
      )}
    </div>
  );
}
