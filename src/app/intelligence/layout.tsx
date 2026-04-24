import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securityintelhub.com";

export const metadata: Metadata = {
  title: "Cybersecurity Threat Intelligence Feed — Real-Time Alerts",
  description:
    "Real-time cybersecurity threat intelligence feed. Filter by severity, category, and industry. Track zero-days, ransomware, APTs, and critical vulnerabilities as they emerge.",
  alternates: { canonical: `${siteUrl}/intelligence` },
  openGraph: {
    title: "Cybersecurity Threat Intelligence Feed | Security Intel Hub",
    description: "Real-time threat intelligence with advanced filtering, search, and live updates from verified sources.",
    type: "website",
    url: `${siteUrl}/intelligence`,
    siteName: "Security Intel Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cybersecurity Threat Intelligence Feed",
    description: "Real-time threat intelligence with advanced filtering and live updates.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
