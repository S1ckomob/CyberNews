export const revalidate = 60;

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/article-card";
import { fetchArticles, fetchThreatActors } from "@/lib/queries";
import {
  Lock,
  AlertTriangle,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Activity,
} from "lucide-react";

export const metadata = {
  title: "Ransomware Tracker",
  description: "Live tracking of active ransomware groups, campaigns, victims, and trends.",
};

const RANSOMWARE_GROUPS = [
  "LockBit", "Cl0p", "Black Basta", "ALPHV/BlackCat", "Rhysida",
  "Play Ransomware", "Medusa", "RansomHub", "Akira", "Cicada3301",
];

export default async function RansomwarePage() {
  const [articles, actors] = await Promise.all([fetchArticles(), fetchThreatActors()]);

  const ransomwareArticles = articles.filter(
    (a) =>
      a.category === "ransomware" ||
      a.tags.some((t) => t.includes("ransomware")) ||
      a.title.toLowerCase().includes("ransomware") ||
      a.threatActors.some((ta) => RANSOMWARE_GROUPS.some((rg) => ta.includes(rg)))
  );

  const ransomwareActors = actors.filter(
    (a) =>
      a.ttps.some((t) => t.toLowerCase().includes("ransomware") || t.toLowerCase().includes("extortion")) ||
      RANSOMWARE_GROUPS.some((rg) => a.name.includes(rg) || a.aliases.some((al) => al.includes(rg)))
  );

  // Group articles per actor
  const actorActivity = ransomwareActors.map((actor) => {
    const related = ransomwareArticles.filter((a) =>
      a.threatActors.some((t) => t === actor.name || actor.aliases.includes(t))
    );
    return { actor, articles: related };
  }).sort((a, b) => b.articles.length - a.articles.length);

  const criticalCount = ransomwareArticles.filter((a) => a.threatLevel === "critical").length;
  const targetedIndustries = [...new Set(ransomwareArticles.flatMap((a) => a.industries))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Lock className="h-6 w-6 text-threat-critical" />
        <h1 className="text-2xl font-bold tracking-tight">Ransomware Tracker</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Live tracking of active ransomware groups, campaigns, and trends
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card className="border-threat-critical/20 bg-threat-critical/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{ransomwareArticles.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-high">{ransomwareActors.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Groups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-threat-critical">{criticalCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-mono font-bold text-primary">{targetedIndustries.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Industries Hit</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Active Groups */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-threat-critical" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Active Ransomware Groups
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {actorActivity.map(({ actor, articles: related }) => (
                <Link key={actor.id} href={`/threat-actors/${actor.id}`}>
                  <Card className="group h-full transition-all hover:border-threat-critical/30 hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {actor.name}
                          </h3>
                          {actor.aliases.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {actor.aliases.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-threat-critical" />
                          <span className="text-xs font-mono font-bold text-threat-critical">
                            {related.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {actor.ttps.slice(0, 3).map((ttp) => (
                          <Badge key={ttp} variant="secondary" className="text-[10px]">
                            {ttp}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Origin: {actor.origin}</span>
                        <span>&middot;</span>
                        <span>Last active: {actor.lastActive}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recent Ransomware Activity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-threat-critical" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Recent Ransomware Activity ({ransomwareArticles.length})
              </h2>
            </div>
            {ransomwareArticles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No ransomware articles found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {ransomwareArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Most Active */}
          <Card className="border-threat-critical/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-threat-critical">
                  Most Active
                </h3>
              </div>
              <div className="space-y-2">
                {actorActivity.slice(0, 8).map(({ actor, articles: related }, i) => (
                  <Link
                    key={actor.id}
                    href={`/threat-actors/${actor.id}`}
                    className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-medium">{actor.name}</span>
                    </div>
                    <span className="font-mono font-bold text-threat-critical">{related.length}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Targeted Industries */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Targeted Industries
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetedIndustries.map((ind) => {
                  const count = ransomwareArticles.filter((a) => a.industries.includes(ind as typeof a.industries[number])).length;
                  return (
                    <Link key={ind} href={`/industry/${ind}`}>
                      <Badge variant="outline" className="text-xs capitalize gap-1 cursor-pointer hover:bg-accent">
                        {ind}
                        <span className="font-mono text-primary">{count}</span>
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Critical */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-threat-critical" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Critical Ransomware
                </h3>
              </div>
              <div className="space-y-1">
                {ransomwareArticles
                  .filter((a) => a.threatLevel === "critical")
                  .slice(0, 5)
                  .map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
