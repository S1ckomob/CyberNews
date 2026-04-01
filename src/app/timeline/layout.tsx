import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Threat Timeline",
  description: "Chronological view of cybersecurity threats grouped by date. Filter by severity to track attack progression.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
