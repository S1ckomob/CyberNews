import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CVE Search & Tracker",
  description: "Search and track Common Vulnerabilities and Exposures with CVSS scores, exploitation status, and linked threat intelligence.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
