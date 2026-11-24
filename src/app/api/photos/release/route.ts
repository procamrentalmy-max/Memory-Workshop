import { releasePhotos } from "@/lib/store";
import { PHOTO_FILE_RE } from "@/lib/types";

/**
 * A customer's browser lets go of photos it no longer uses (replaced, removed, or a page discarded),
 * so they're deleted straight away. Photos that are part of a booking are never deleted here.
 * Also sent with navigator.sendBeacon when the page is closed.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const files: unknown[] = Array.isArray(body?.files) ? body.files : [];
  const valid = [...new Set(files.filter((f): f is string => typeof f === "string" && PHOTO_FILE_RE.test(f)))].slice(0, 100);
  try {
    await releasePhotos(valid);
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
