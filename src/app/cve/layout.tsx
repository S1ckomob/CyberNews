import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";

export const metadata: Metadata = {
  title: "CVE Database Search & Vulnerability Tracker",
  description:
    "Search the latest CVEs (Common Vulnerabilities and Exposures) with real-time CVSS scores, exploitation status, affected products, and linked threat intelligence. Track critical and zero-day vulnerabilities.",
  alternates: { canonical: `${siteUrl}/cve` },
  openGraph: {
    title: "CVE Database Search & Vulnerability Tracker | Security Intel Hub",
    description:
      "Search and track CVEs with CVSS scores, exploitation status, and linked threat intelligence from verified sources.",
    type: "website",
    url: `${siteUrl}/cve`,
    siteName: "Security Intel Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "CVE Database Search & Vulnerability Tracker",
    description:
      "Search and track CVEs with CVSS scores, exploitation status, and linked threat intelligence.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
