import { ImageResponse } from "next/og";
import { fetchArticleBySlug } from "@/lib/queries";

export const revalidate = 3600;

const THREAT_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#6b7280",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#0a0e1a", color: "#fff", fontSize: 32 }}>
          Security Intel Hub — Article Not Found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const color = THREAT_COLORS[article.threatLevel] || "#6b7280";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0e1a",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "18px" }}>
              S
            </div>
            <span style={{ color: "#94a3b8", fontSize: "20px", fontWeight: 600 }}>Security Intel Hub</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "6px",
              background: `${color}20`,
              border: `2px solid ${color}50`,
            }}
          >
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
            <span style={{ color, fontSize: "16px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "monospace" }}>
              {article.threatLevel}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ color: "#e2e8f0", fontSize: "44px", fontWeight: 700, lineHeight: 1.2, margin: 0, maxHeight: "180px", overflow: "hidden" }}>
            {article.title}
          </h1>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "40px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            {article.cves.slice(0, 3).map((cve) => (
              <span
                key={cve}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: "#1e293b",
                  color: "#ea580c",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                }}
              >
                {cve}
              </span>
            ))}
            <span style={{ padding: "4px 10px", borderRadius: "4px", background: "#1e293b", color: "#94a3b8", fontSize: "14px" }}>
              {article.category}
            </span>
          </div>
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            {article.source} · {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
