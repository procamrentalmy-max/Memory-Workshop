import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { removeCafeMenu, setCafeMenu } from "@/lib/store";

const MAX_BYTES = 4.4 * 1024 * 1024; // the live site (Vercel) refuses uploads above 4.5 MB

/** Upload (or replace) the café menu PDF. */
export async function POST(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Please choose a PDF file." }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "The PDF must be under 4.4 MB. Try exporting it with a smaller file size." }, { status: 400 });
  }
  const bytes = await file.arrayBuffer();
  // Real PDFs start with "%PDF".
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== "%PDF") {
    return Response.json({ error: "That file isn't a PDF." }, { status: 400 });
  }
  try {
    const menu = await setCafeMenu(bytes);
    revalidatePath("/shop");
    revalidatePath("/admin");
    return Response.json({ ok: true, menu });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Remove the café menu (the shop page goes back to showing the drinks list). */
export async function DELETE(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "Not authorised" }, { status: 401 });
  }
  try {
    await removeCafeMenu();
    revalidatePath("/shop");
    revalidatePath("/admin");
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
