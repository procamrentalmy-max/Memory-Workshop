import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { PAGE, fitsOnPage, heightForWidth, sizeLabel } from "@/lib/pageSize";
import { addElement } from "@/lib/store";
import type { Rect } from "@/lib/types";

const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 4.4 * 1024 * 1024; // Vercel refuses request bodies above 4.5 MB

export async function POST(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const name = String(form.get("name") ?? "").trim();
  const price = Number(form.get("price"));
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const widthCm = Math.round(Number(form.get("widthCm")) * 100) / 100;
  // Photo frames: where the customer's photo goes, as % of the image.
  let photoWindow: Rect | null = null;
  const rawWindow = form.get("photoWindow");
  if (typeof rawWindow === "string" && rawWindow) {
    try {
      const r = JSON.parse(rawWindow) as Rect;
      const ok = [r.x, r.y, r.w, r.h].every((n) => typeof n === "number" && Number.isFinite(n))
        && r.x >= 0 && r.y >= 0 && r.w >= 3 && r.h >= 3 && r.x + r.w <= 100.01 && r.y + r.h <= 100.01;
      if (!ok) throw new Error();
      const two = (n: number) => Math.round(n * 100) / 100;
      photoWindow = { x: two(r.x), y: two(r.y), w: two(r.w), h: two(r.h) };
    } catch {
      return Response.json({ error: "Please mark where the photo goes on the frame." }, { status: 400 });
    }
  }

  if (!(file instanceof File)) return Response.json({ error: "Please choose an image." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Use a PNG, JPG, WEBP or GIF image." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Image must be under 4.4 MB." }, { status: 400 });
  if (!name) return Response.json({ error: "Please give the element a name." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return Response.json({ error: "Price must be 0 or more." }, { status: 400 });
  if (!(width > 0 && height > 0)) return Response.json({ error: "Could not read the image size." }, { status: 400 });
  if (!(widthCm > 0)) return Response.json({ error: "Please enter the element's printed width in cm." }, { status: 400 });
  // Height always follows the image's proportions, so the element is never stretched or cropped.
  const heightCm = heightForWidth(widthCm, { width, height });
  if (!fitsOnPage(widthCm, heightCm)) {
    return Response.json(
      { error: `At ${sizeLabel(widthCm, heightCm)} this element is bigger than the A4 page (${sizeLabel(PAGE.widthCm, PAGE.heightCm)}). Please enter a smaller width.` },
      { status: 400 },
    );
  }

  let id: string;
  try {
    id = await addElement(
      { name: name.slice(0, 80), price: Math.round(price * 100) / 100, width: Math.round(width), height: Math.round(height), widthCm, heightCm, photoWindow, ext, contentType: file.type },
      await file.arrayBuffer(),
    );
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
  revalidatePath("/admin");
  revalidatePath("/book");
  return Response.json({ ok: true, id });
}
