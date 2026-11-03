import { ImageResponse } from "next/og";
import type { Article } from "./types";

export const OG_SIZE = { width: 1200, height: 630 };

/** Link-preview card: brand + the current top 3 headlines, so a shared DevPulse link shows real content. */
export function ogImage(heading: string, articles: Article[]) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0b0b0f", color: "#ececf1", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: "#34d399" }} />
          DevPulse
          <span style={{ fontSize: 28, fontWeight: 400, color: "#8d8d9b" }}>· {heading}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 56 }}>
          {articles.slice(0, 3).map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <span style={{ fontSize: 34, color: "#34d399", width: 40 }}>{i + 1}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 38, lineHeight: 1.2 }}>{a.title.length > 80 ? `${a.title.slice(0, 78)}…` : a.title}</span>
                <span style={{ fontSize: 24, color: "#8d8d9b", marginTop: 6 }}>{a.source}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 24, color: "#8d8d9b" }}>Tech news for builders · open source</div>
      </div>
    ),
    OG_SIZE,
  );
}
