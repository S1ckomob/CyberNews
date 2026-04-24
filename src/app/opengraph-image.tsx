import { ImageResponse } from "next/og";

export const alt = "Security Intel Hub — Institutional Cybersecurity Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 50%, #0a0e1a 100%)",
          color: "#fff",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            S
          </div>
          <span style={{ fontSize: "28px", fontWeight: 600, color: "#94a3b8" }}>
            Security Intel Hub
          </span>
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "900px",
            marginBottom: "24px",
          }}
        >
          Institutional Cybersecurity Intelligence
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Real-time threat data • CVE tracking • Threat actor profiles • Verified sources
        </div>
      </div>
    ),
    { ...size }
  );
}
