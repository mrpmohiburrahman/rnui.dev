import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "rnui.dev — Curated React Native UI & Animation Catalog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#38bdf8", fontSize: "28px", fontWeight: 600, letterSpacing: "0.05em" }}>
            rnui.dev
          </div>
          <div
            style={{
              color: "#f1f5f9",
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: "800px",
            }}
          >
            Curated React Native UI & Animation Catalog
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: "28px",
              fontWeight: 400,
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            343+ animations across Reanimated, Skia, Moti, Gesture Handler, and Lottie. AI-assisted contributions powered by OpenAI Codex.
          </div>
        </div>
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <div
            style={{
              background: "#38bdf8",
              color: "#0f172a",
              fontSize: "20px",
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: "8px",
            }}
          >
            Powered by OpenAI Codex
          </div>
          <div style={{ color: "#475569", fontSize: "20px" }}>github.com/mrpmohiburrahman/rnui.dev</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
