import { touchPhotos } from "@/lib/store";
import { PHOTO_FILE_RE } from "@/lib/types";

/**
 * The booking pages call this while a customer is working with their photos, so unbooked
 * drafts stay for another 7 days. Only existing photos are recorded; nothing is returned about them.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const files: unknown[] = Array.isArray(body?.files) ? body.files : [];
  const valid = [...new Set(files.filter((f): f is string => typeof f === "string" && PHOTO_FILE_RE.test(f)))].slice(0, 200);
  try {
    await touchPhotos(valid);
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
