import { PHOTOS_BUCKET, db } from "@/lib/supabase";

// Photos are shrunk in the browser first (max 3000 px, JPEG), so they stay well under
// Vercel's 4.5 MB request limit.
const MAX_BYTES = 4 * 1024 * 1024;

/** A customer uploads a photo for a photo frame. Returns the stored name. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const w = Math.round(Number(form?.get("w")));
  const h = Math.round(Number(form?.get("h")));

  if (!(file instanceof File)) return Response.json({ error: "Please choose a photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That photo is too large. Please try another." }, { status: 413 });
  if (!(w > 0 && h > 0 && w <= 6000 && h <= 6000)) return Response.json({ error: "Could not read the photo size." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Only real JPEG files (they start with FF D8 FF).
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return Response.json({ error: "That file isn't a supported photo." }, { status: 400 });
  }

  const name = `${crypto.randomUUID()}.jpg`;
  try {
    const { error } = await db().storage.from(PHOTOS_BUCKET).upload(name, bytes, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("Photo upload failed:", e);
    return Response.json({ error: "We couldn't save your photo. Please try again." }, { status: 500 });
  }
  return Response.json({ file: name, w, h });
}
