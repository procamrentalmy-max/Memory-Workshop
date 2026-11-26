import { headers } from "next/headers";
import { listTags } from "@/lib/tags";

/** CSV of tags (link to write on each NFC tag, and the setup code to print on its card). Admin only (see proxy.ts). */
export async function GET(request: Request) {
  const batch = new URL(request.url).searchParams.get("batch");
  const h = await headers();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/$/, "");
  const tags = (await listTags(5000)).filter((t) => !batch || t.batch === batch).reverse();
  const rows = [
    ["link", "setup_code", "video_seconds", "batch", "has_video"],
    ...tags.map((t) => [`${base}/v/${t.id}`, t.setupCode, String(t.maxSeconds), t.batch ?? "", t.videoFile ? "yes" : "no"]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="nfc-tags${batch ? `-${batch}` : ""}.csv"` },
  });
}
