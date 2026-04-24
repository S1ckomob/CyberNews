import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Browse our cybersecurity intelligence feed, CVE database, or threat actor profiles.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The intelligence you&apos;re looking for may have been moved or doesn&apos;t exist.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/">
          <Button className="gap-2">
            Latest Intelligence <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/cve">
          <Button variant="outline" className="gap-2">
            Search CVEs
          </Button>
        </Link>
        <Link href="/threat-actors">
          <Button variant="outline" className="gap-2">
            Threat Actors
          </Button>
        </Link>
      </div>
    </div>
  );
}
