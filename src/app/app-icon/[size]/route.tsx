import { ImageResponse } from "next/og";

/** Home screen app icons (192 and 512 px), drawn like the apple-icon. */
export async function GET(_request: Request, ctx: RouteContext<"/app-icon/[size]">) {
  const { size } = await ctx.params;
  const px = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#b8492f", color: "#fff", fontSize: px * 0.6, fontWeight: 700, fontFamily: "serif" }}>
        P
      </div>
    ),
    { width: px, height: px, headers: { "Cache-Control": "public, max-age=604800" } },
  );
}
