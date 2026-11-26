import { ImageResponse } from "next/og";
import { PACKAGES, STUDIO, formatRM } from "@/lib/data";

export const alt = `${STUDIO.name}, a hands-on memory creation studio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARDS = [
  { bg: "#f3e3cf", a: "#86a873", b: "#bb4430", rotate: -7, x: 690, y: 60 },
  { bg: "#ffe5ec", a: "#c9184a", b: "#ff8fa3", rotate: 5, x: 910, y: 36 },
  { bg: "#1f1d36", a: "#e9a6a6", b: "#864879", rotate: -1, x: 805, y: 255 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#faf6ef", position: "relative", fontFamily: "serif" }}>
        <div style={{ display: "flex", flexDirection: "column", padding: "72px 0 0 80px", width: 620 }}>
          <div style={{ fontSize: 30, color: "#b8492f" }}>a hands-on memory creation studio</div>
          <div style={{ fontSize: 64, lineHeight: 1.08, color: "#2a2420", fontWeight: 700, marginTop: 16 }}>
            Turn your favourite moments into keepsakes.
          </div>
          <div style={{ fontSize: 28, color: "#6b6058", marginTop: 26 }}>
            {`Workshops from ${formatRM(Math.min(...PACKAGES.map((p) => p.price)))} · Memory Badges · photo prints`}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 36 }}>
            <div style={{ width: 54, height: 54, borderRadius: 10, background: "#b8492f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 700 }}>P</div>
            <div style={{ fontSize: 36, color: "#2a2420", marginLeft: 16, fontWeight: 700 }}>{STUDIO.name}</div>
          </div>
        </div>
        {CARDS.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: 230, height: 325, background: "#fff", padding: 10, borderRadius: 14, transform: `rotate(${c.rotate}deg)`, display: "flex", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
            <div style={{ flex: 1, background: c.bg, borderRadius: 8, display: "flex", padding: 26 }}>
              <div style={{ flex: 1, background: `linear-gradient(160deg, ${c.b}, ${c.a})`, border: "8px solid #fff" }} />
            </div>
          </div>
        ))}
      </div>
    ),
    size,
  );
}
