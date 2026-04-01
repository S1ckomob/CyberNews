import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchArticles } from "@/lib/queries";
import type { Industry } from "@/lib/types";
import { Building2, ChevronRight, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Industry Intelligence",
  description:
    "Cybersecurity intelligence organized by industry sector.",
};

const INDUSTRIES: {
  value: Industry;
  label: string;
  icon: string;
}[] = [
  { value: "healthcare", label: "Healthcare", icon: "🏥" },
  { value: "finance", label: "Finance", icon: "🏦" },
  { value: "government", label: "Government", icon: "🏛️" },
  { value: "energy", label: "Energy", icon: "⚡" },
  { value: "technology", label: "Technology", icon: "💻" },
  { value: "defense", label: "Defense", icon: "🛡️" },
  { value: "retail", label: "Retail", icon: "🛒" },
  { value: "education", label: "Education", icon: "🎓" },
  { value: "telecommunications", label: "Telecommunications", icon: "📡" },
  { value: "manufacturing", label: "Manufacturing", icon: "🏭" },
];

export default async function IndustriesPage() {
  const articles = await fetchArticles();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Industry Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">
          Threat intelligence organized by industry sector
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry) => {
          const count = articles.filter((a) =>
            a.industries.includes(industry.value)
          ).length;
          const criticalCount = articles.filter(
            (a) =>
              a.industries.includes(industry.value) &&
              a.threatLevel === "critical"
          ).length;

          return (
            <Link key={industry.value} href={`/industry/${industry.value}`}>
              <Card className="group h-full transition-all hover:shadow-md hover:border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl mb-2">{industry.icon}</div>
                      <h2 className="font-semibold group-hover:text-primary transition-colors">
                        {industry.label}
                      </h2>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="font-mono font-bold text-primary">
                      {count}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      reports
                    </span>
                    {criticalCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-threat-critical border-threat-critical/30 gap-1"
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {criticalCount} critical
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
