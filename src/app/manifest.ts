import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Security Intel Hub — Cybersecurity Threat Intelligence",
    short_name: "Security Intel Hub",
    description:
      "Real-time cybersecurity threat intelligence. CVE tracking, threat actor profiles, and vulnerability alerts from verified sources.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["news", "security", "business"],
  };
}
