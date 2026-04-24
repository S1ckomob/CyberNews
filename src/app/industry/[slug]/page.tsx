export const revalidate = 60;

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleCard } from "@/components/article-card";
import { fetchArticlesByIndustry } from "@/lib/queries";
import type { Industry } from "@/lib/types";
import type { Metadata } from "next";
import { Building2, ChevronRight, AlertTriangle, Shield } from "lucide-react";

const INDUSTRIES: Record<Industry, { label: string; description: string }> = {
  healthcare: {
    label: "Healthcare",
    description:
      "Cyber threats targeting hospitals, pharmaceutical companies, medical devices, and health information systems.",
  },
  finance: {
    label: "Finance",
    description:
      "Threats targeting banks, financial institutions, payment processors, and fintech companies.",
  },
  government: {
    label: "Government",
    description:
      "Cyber operations targeting government agencies, defense organizations, and public sector infrastructure.",
  },
  energy: {
    label: "Energy",
    description:
      "Threats against power grids, oil and gas, nuclear facilities, and critical energy infrastructure.",
  },
  retail: {
    label: "Retail",
    description:
      "Attacks targeting retail operations, e-commerce platforms, and point-of-sale systems.",
  },
  technology: {
    label: "Technology",
    description:
      "Threats against technology companies, software vendors, cloud services, and tech infrastructure.",
  },
  education: {
    label: "Education",
    description:
      "Cyber threats targeting universities, school districts, and educational platforms.",
  },
  defense: {
    label: "Defense",
    description:
      "Threats targeting defense contractors, military systems, and national security infrastructure.",
  },
  telecommunications: {
    label: "Telecommunications",
    description:
      "Attacks against telecom providers, ISPs, and communications infrastructure.",
  },
  manufacturing: {
    label: "Manufacturing",
    description:
      "Threats targeting industrial control systems, OT networks, and manufacturing operations.",
  },
};

const ALL_INDUSTRIES = Object.keys(INDUSTRIES) as Industry[];


const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";

export function generateStaticParams() {
  return ALL_INDUSTRIES.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = INDUSTRIES[slug as Industry];
  if (!industry) return { title: "Not Found" };
  const pageUrl = `${siteUrl}/industry/${slug}`;
  return {
    title: `${industry.label} Cybersecurity Threats & Intelligence`,
    description: `${industry.description} Real-time threat intelligence, CVE tracking, and vulnerability alerts for the ${industry.label.toLowerCase()} sector.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${industry.label} Cyber Threat Intelligence | Security Intel Hub`,
      description: industry.description,
      type: "website",
      url: pageUrl,
      siteName: "Security Intel Hub",
    },
    twitter: {
      card: "summary_large_image",
      title: `${industry.label} Cyber Threat Intelligence`,
      description: industry.description,
    },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = INDUSTRIES[slug as Industry];
  if (!industry) notFound();

  const industryArticles = await fetchArticlesByIndustry(slug);
  const criticalCount = industryArticles.filter(
    (a) => a.threatLevel === "critical"
  ).length;

  const pageUrl = `${siteUrl}/industry/${slug}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Industries", item: `${siteUrl}/industry` },
      { "@type": "ListItem", position: 3, name: industry.label, item: pageUrl },
    ],
  };
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${industry.label} Cybersecurity Intelligence`,
    description: industry.description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: industryArticles.length,
      itemListElement: industryArticles.slice(0, 10).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl}/article/${a.slug}`,
        name: a.title,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/industry"
          className="hover:text-foreground transition-colors"
        >
          Industries
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{industry.label}</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            {industry.label} Intelligence
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {industry.description}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {industryArticles.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Reports
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-critical">
              {criticalCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Critical Threats
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-mono font-bold text-threat-high">
              {industryArticles.filter((a) => a.threatLevel === "high").length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              High Threats
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles */}
      {industryArticles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold">No threats reported</h3>
            <p className="text-xs text-muted-foreground mt-1">
              No active intelligence for this industry
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industryArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
