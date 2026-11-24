import { PHOTOS_BUCKET, db } from "@/lib/supabase";
import { PHOTO_FILE_RE } from "@/lib/types";

/**
 * Opens a customer photo from the private bucket via a short-lived link (photos are full-size originals,
 * too big to pass through the website). Names are random UUIDs, so a photo can only be opened by someone
 * who already has its name (the customer's own pages, or the studio's staff).
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/photos/[file]">) {
  const { file } = await ctx.params;
  if (!PHOTO_FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  const { data, error } = await db().storage.from(PHOTOS_BUCKET).createSignedUrl(file, 3600);
  if (error || !data) return new Response("Not found", { status: 404 });
  return new Response(null, {
    status: 307,
    headers: { Location: data.signedUrl, "Cache-Control": "private, max-age=3000" },
  });
}
