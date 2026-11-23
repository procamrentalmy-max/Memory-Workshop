import { PHOTOS_BUCKET, db } from "@/lib/supabase";
import { PHOTO_FILE_RE } from "@/lib/types";

/**
 * Serves a customer photo from the private bucket. Names are random UUIDs, so a photo can only
 * be opened by someone who already has its link (the customer's own page, or the studio's admin).
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/photos/[file]">) {
  const { file } = await ctx.params;
  if (!PHOTO_FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  const { data, error } = await db().storage.from(PHOTOS_BUCKET).download(file);
  if (error || !data) return new Response("Not found", { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
