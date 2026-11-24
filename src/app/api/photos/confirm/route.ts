import { readJpegInfo } from "@/lib/jpeg";
import { touchPhotos } from "@/lib/store";
import { PHOTOS_BUCKET, db } from "@/lib/supabase";
import { PHOTO_FILE_RE } from "@/lib/types";

/**
 * Step 2 of a photo upload: checks what arrived is a real, upright JPEG of the size the browser saw,
 * and records it (which starts its "draft" clock). Anything else is deleted.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const file = String(body?.file ?? "");
  const w = Math.round(Number(body?.w));
  const h = Math.round(Number(body?.h));
  if (!PHOTO_FILE_RE.test(file) || !(w > 0 && h > 0 && w <= 20000 && h <= 20000)) {
    return Response.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }

  const bucket = db().storage.from(PHOTOS_BUCKET);
  const { data: link } = await bucket.createSignedUrl(file, 60);
  if (!link) return Response.json({ error: "Your photo didn't arrive. Please try again." }, { status: 400 });
  try {
    // The size and rotation are at the start of the file.
    const res = await fetch(link.signedUrl, { headers: { Range: "bytes=0-524287" } });
    const info = res.ok ? readJpegInfo(new Uint8Array(await res.arrayBuffer())) : null;
    if (!info || info.orientation !== 1 || info.width !== w || info.height !== h) {
      await bucket.remove([file]);
      return Response.json({ error: "That file isn't a supported photo. Please choose another." }, { status: 400 });
    }
    await touchPhotos([file]);
  } catch (e) {
    console.error("Photo check failed:", e);
    return Response.json({ error: "We couldn't save your photo. Please try again." }, { status: 500 });
  }
  return Response.json({ file, w, h });
}
