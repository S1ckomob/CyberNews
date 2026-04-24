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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";

export const metadata = {
  title: "About Security Intel Hub — Cybersecurity Intelligence Platform",
  description:
    "Security Intel Hub is the institutional standard for cybersecurity intelligence. Real-time threat data from CISA, Mandiant, Microsoft, and other verified sources. Trusted by 15,000+ security professionals.",
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: "About Security Intel Hub | Cybersecurity Intelligence Platform",
    description: "The institutional standard for cybersecurity intelligence. Real-time threat data from verified sources.",
    type: "website",
    url: `${siteUrl}/about`,
    siteName: "Security Intel Hub",
  },
};

export default function AboutPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Security Intel Hub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Security Intel Hub is the institutional standard for cybersecurity intelligence. We aggregate real-time threat data from verified sources including CISA, Microsoft Threat Intelligence, Mandiant, and other authoritative organizations. Our platform provides CVE tracking, threat actor profiles, and vulnerability alerts for security teams.",
        },
      },
      {
        "@type": "Question",
        name: "What sources does Security Intel Hub use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We aggregate intelligence from CISA Advisories, Microsoft Threat Intelligence, Mandiant/Google TAG, CrowdStrike Intelligence, FBI/NSA Joint Advisories, Vendor Security Bulletins, the NVD/CVE Database, academic research, and open source intelligence (OSINT).",
        },
      },
      {
        "@type": "Question",
        name: "How often is the threat intelligence updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Security Intel Hub provides real-time threat intelligence with 24/7 monitoring. Threats are published as they are verified from our source feeds, with the intelligence feed updating continuously throughout the day.",
        },
      },
      {
        "@type": "Question",
        name: "What industries does Security Intel Hub cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We track threats across all major industries including healthcare, finance, government, energy, retail, technology, education, defense, telecommunications, and manufacturing. Each industry has dedicated intelligence feeds and threat tracking.",
        },
      },
      {
        "@type": "Question",
        name: "How can I search for CVEs?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use our CVE Database Search at securityintelhub.com/cve to search by CVE ID, affected product, vendor, or threat actor. Filter by severity level (critical, high, medium, low) to find the vulnerabilities most relevant to your organization.",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          About Security Intel Hub
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
          Security Intel Hub exists to provide security professionals with the most
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
          Security Intel Hub aggregates intelligence from the most trusted sources in
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
