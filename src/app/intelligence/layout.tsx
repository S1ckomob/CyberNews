import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence Feed",
  description: "Real-time cybersecurity threat intelligence feed with advanced filtering, search, and live updates.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
