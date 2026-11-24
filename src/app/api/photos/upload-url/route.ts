import { PHOTOS_BUCKET, db } from "@/lib/supabase";
import { MAX_PHOTO_BYTES } from "@/lib/types";

/**
 * Step 1 of a photo upload: gives the customer's browser a one-time link to upload the photo straight
 * to storage. Photos go up at full size (the original from the phone), so they print as sharp as possible;
 * this way they don't pass through the website, which can't take requests over 4.5 MB.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const bytes = Number(body?.bytes);
  if (!(bytes > 0)) return Response.json({ error: "Please choose a photo." }, { status: 400 });
  if (bytes > MAX_PHOTO_BYTES) return Response.json({ error: "That photo is too large (over 30 MB). Please choose another." }, { status: 413 });

  const file = `${crypto.randomUUID()}.jpg`;
  const { data, error } = await db().storage.from(PHOTOS_BUCKET).createSignedUploadUrl(file);
  if (error || !data) {
    console.error("Could not create an upload link:", error);
    return Response.json({ error: "We couldn't save your photo. Please try again." }, { status: 500 });
  }
  return Response.json({ file, uploadUrl: data.signedUrl });
}
