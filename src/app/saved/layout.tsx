import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Articles",
  description: "Your bookmarked cybersecurity threat intelligence articles.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
