import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Watchlist",
  description: "Monitor specific products, threat actors, and CVEs. Matching threat intelligence appears automatically.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
