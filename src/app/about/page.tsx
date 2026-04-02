import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  CheckCircle,
  Globe,
  Clock,
  Users,
  Lock,
  Eye,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "About Security Standard",
  description:
    "Security Standard is the institutional standard for cybersecurity intelligence. Learn about our mission, methodology, and commitment to accuracy.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          About Security Standard
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The institutional standard for cybersecurity intelligence. Built for
          security teams who need facts, not hype.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Our Mission
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Security Standard exists to provide security professionals with the most
          accurate, timely, and actionable threat intelligence available. We
          aggregate data from verified sources, enrich it with our analysis,
          and deliver it in a format optimized for security decision-making.
          No clickbait. No fear-mongering. Just verified intelligence.
        </p>
      </section>

      {/* Principles */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-6">
          Our Principles
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: CheckCircle,
              title: "Accuracy First",
              description:
                "Every report is sourced, attributed, and verified. We never publish unverified claims as fact.",
            },
            {
              icon: Clock,
              title: "Timeliness",
              description:
                "Threats are published in real-time as they are verified. Speed matters, but never at the expense of accuracy.",
            },
            {
              icon: Eye,
              title: "Transparency",
              description:
                "Full source attribution on every report. You can always trace our intelligence back to its origin.",
            },
            {
              icon: Lock,
              title: "No Speculation",
              description:
                "Analysis is clearly labeled as such. Facts and assessments are always distinguished.",
            },
            {
              icon: Globe,
              title: "Global Coverage",
              description:
                "We track threats across every region and industry. Our coverage is comprehensive, not selective.",
            },
            {
              icon: Zap,
              title: "Actionable",
              description:
                "Every report includes affected products, CVEs, and remediation guidance. Intelligence you can act on.",
            },
          ].map((principle) => (
            <Card key={principle.title}>
              <CardContent className="p-4">
                <principle.icon className="h-5 w-5 text-primary mb-2" />
                <h3 className="text-sm font-semibold">{principle.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {principle.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Sources */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Our Sources
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Security Standard aggregates intelligence from the most trusted sources in
          cybersecurity:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "CISA Advisories",
            "Microsoft Threat Intelligence",
            "Mandiant / Google TAG",
            "CrowdStrike Intelligence",
            "FBI / NSA Joint Advisories",
            "Vendor Security Bulletins",
            "NVD / CVE Database",
            "Academic Research",
            "Open Source Intelligence",
          ].map((source) => (
            <div
              key={source}
              className="flex items-center gap-2 rounded-md bg-card p-3 text-sm"
            >
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              {source}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4 text-center">
              Platform Metrics
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
              {[
                { value: "15K+", label: "Security Professionals" },
                { value: "500+", label: "CVEs Tracked Monthly" },
                { value: "50+", label: "Threat Actors Profiled" },
                { value: "24/7", label: "Real-time Monitoring" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
