// Server-only data access: elements, uploads and bookings, stored in Supabase.
import { orderPhotoFiles } from "./orderPhotos";
import { ELEMENTS_BUCKET, PHOTOS_BUCKET, SITE_FILES_BUCKET, db } from "./supabase";
import type { CafeMenu, Element, Order, Rect } from "./types";

export type Booking = {
  reference: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  payment: string;
  order: Order;
  totals: { session: number; pages: number; drinks: number; total: number };
};

type ElementRow = {
  id: string; name: string; price: string | number; file: string; width: number; height: number;
  width_cm: string | number; height_cm: string | number; photo_window: Rect | null; created_at: string;
};
const ELEMENT_COLUMNS = "id,name,price,file,width,height,width_cm,height_cm,photo_window,created_at";
const toElement = (r: ElementRow): Element => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  file: r.file,
  width: r.width,
  height: r.height,
  widthCm: Number(r.width_cm),
  heightCm: Number(r.height_cm),
  photoWindow: r.photo_window ?? null,
  createdAt: r.created_at,
});

export async function getElements(): Promise<Element[]> {
  const { data, error } = await db()
    .from("elements")
    .select(ELEMENT_COLUMNS)
    .eq("archived", false)
    .order("created_at");
  if (error) throw new Error(`Could not load elements: ${error.message}`);
  return (data as ElementRow[]).map(toElement);
}

/** Uploads the image to storage, then records the element. */
export async function addElement(
  el: {
    name: string; price: number; width: number; height: number; widthCm: number; heightCm: number;
    photoWindow: Rect | null; ext: string; contentType: string;
  },
  bytes: ArrayBuffer,
) {
  const id = crypto.randomUUID();
  const file = `${id}.${el.ext}`;
  const up = await db().storage.from(ELEMENTS_BUCKET).upload(file, bytes, {
    contentType: el.contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
  const { error } = await db()
    .from("elements")
    .insert({ id, name: el.name, price: el.price, file, width: el.width, height: el.height, width_cm: el.widthCm, height_cm: el.heightCm, photo_window: el.photoWindow });
  if (error) {
    await db().storage.from(ELEMENTS_BUCKET).remove([file]);
    throw new Error(`Could not save element: ${error.message}`);
  }
  return id;
}

export async function getElement(id: string): Promise<Element | null> {
  const { data, error } = await db().from("elements").select(ELEMENT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load element: ${error.message}`);
  return data ? toElement(data as ElementRow) : null;
}

export async function updateElement(id: string, patch: { name: string; price: number; widthCm: number; heightCm: number }) {
  const { error } = await db()
    .from("elements")
    .update({ name: patch.name, price: patch.price, width_cm: patch.widthCm, height_cm: patch.heightCm })
    .eq("id", id);
  if (error) throw new Error(`Could not update element: ${error.message}`);
}

/**
 * Removes the element from the editor. The row and image are kept (archived) so
 * past bookings that used it can still be shown and printed.
 */
export async function deleteElement(id: string) {
  const { error } = await db().from("elements").update({ archived: true }).eq("id", id);
  if (error) throw new Error(`Could not delete element: ${error.message}`);
}

export async function getElementsByIds(ids: string[]): Promise<Element[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db()
    .from("elements")
    .select(ELEMENT_COLUMNS)
    .in("id", ids)
    .eq("archived", false);
  if (error) throw new Error(`Could not load elements: ${error.message}`);
  return (data as ElementRow[]).map(toElement);
}

type BookingRow = {
  reference: string; created_at: string; name: string; email: string; phone: string; notes: string;
  payment: string; order: Order; totals: Booking["totals"];
};

export async function getBookings(limit = 200): Promise<Booking[]> {
  const { data, error } = await db()
    .from("bookings")
    .select("reference,created_at,name,email,phone,notes,payment,order,totals")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load bookings: ${error.message}`);
  return (data as BookingRow[]).map((r) => ({ ...r, createdAt: r.created_at }));
}

export async function addBooking(b: Omit<Booking, "reference" | "createdAt">): Promise<string> {
  const visit = b.order.visit!;
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = `PM-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    const { error } = await db().from("bookings").insert({
      reference,
      name: b.name,
      email: b.email,
      phone: b.phone,
      notes: b.notes,
      payment: b.payment,
      visit_date: visit.date,
      arrival_time: visit.time,
      people: visit.people,
      order: b.order,
      totals: b.totals,
      total: b.totals.total,
    });
    if (!error) return reference;
    if (error.code !== "23505") throw new Error(`Could not save booking: ${error.message}`); // 23505 = duplicate reference
  }
  throw new Error("Could not create a booking reference. Please try again.");
}

/* ───────── Café menu (a PDF uploaded from /admin) ───────── */

export async function getCafeMenu(): Promise<CafeMenu | null> {
  const { data, error } = await db().from("site_settings").select("value").eq("key", "cafe_menu").maybeSingle();
  if (error) throw new Error(`Could not load the café menu: ${error.message}`);
  return (data?.value as CafeMenu | undefined) ?? null;
}

/** Uploads a new menu PDF, makes it the current menu, and deletes the previous file. */
export async function setCafeMenu(bytes: ArrayBuffer): Promise<CafeMenu> {
  const previous = await getCafeMenu();
  const menu: CafeMenu = { file: `cafe-menu-${crypto.randomUUID()}.pdf`, uploadedAt: new Date().toISOString() };
  const up = await db().storage.from(SITE_FILES_BUCKET).upload(menu.file, bytes, {
    contentType: "application/pdf",
    cacheControl: "31536000",
    upsert: false,
  });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
  const { error } = await db()
    .from("site_settings")
    .upsert({ key: "cafe_menu", value: menu, updated_at: menu.uploadedAt });
  if (error) {
    await db().storage.from(SITE_FILES_BUCKET).remove([menu.file]);
    throw new Error(`Could not save the café menu: ${error.message}`);
  }
  if (previous) await db().storage.from(SITE_FILES_BUCKET).remove([previous.file]);
  return menu;
}

export async function removeCafeMenu() {
  const previous = await getCafeMenu();
  const { error } = await db().from("site_settings").delete().eq("key", "cafe_menu");
  if (error) throw new Error(`Could not remove the café menu: ${error.message}`);
  if (previous) await db().storage.from(SITE_FILES_BUCKET).remove([previous.file]);
}

/* ───────── Customer photos: clean-up of photos never used in a booking ───────── */

/** Photos newer than this are kept: their owner may still be choosing pages. */
export const PHOTO_KEEP_DAYS = 7;

export type PhotoCleanupReport = {
  total: number; // photos in storage
  inBookings: number; // used in at least one booking (never deleted)
  recent: number; // unused but uploaded in the last PHOTO_KEEP_DAYS days (kept for now)
  unused: { name: string; size: number }[]; // unused and older: safe to delete
  unusedBytes: number;
  totalBytes: number;
};

async function listCustomerPhotos() {
  const all: { name: string; createdAt: string; size: number }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db().storage.from(PHOTOS_BUCKET).list("", {
      limit: 1000, offset, sortBy: { column: "created_at", order: "asc" },
    });
    if (error) throw new Error(`Could not list photos: ${error.message}`);
    for (const f of data) {
      if (f.created_at && f.metadata) all.push({ name: f.name, createdAt: f.created_at, size: Number(f.metadata.size ?? 0) });
    }
    if (data.length < 1000) break;
  }
  return all;
}

/** Every photo file used by any booking. */
async function photosInBookings(): Promise<Set<string>> {
  const used = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db().from("bookings").select("order").range(from, from + 999);
    if (error) throw new Error(`Could not load bookings: ${error.message}`);
    for (const row of data as { order: Order }[]) for (const f of orderPhotoFiles(row.order)) used.add(f);
    if (data.length < 1000) break;
  }
  return used;
}

export async function getPhotoCleanupReport(): Promise<PhotoCleanupReport> {
  const [photos, used] = await Promise.all([listCustomerPhotos(), photosInBookings()]);
  const cutoff = Date.now() - PHOTO_KEEP_DAYS * 24 * 3600 * 1000;
  const report: PhotoCleanupReport = { total: photos.length, inBookings: 0, recent: 0, unused: [], unusedBytes: 0, totalBytes: 0 };
  for (const p of photos) {
    report.totalBytes += p.size;
    if (used.has(p.name)) report.inBookings++;
    else if (new Date(p.createdAt).getTime() > cutoff) report.recent++;
    else {
      report.unused.push({ name: p.name, size: p.size });
      report.unusedBytes += p.size;
    }
  }
  return report;
}

/** Deletes photos that aren't in any booking and are older than PHOTO_KEEP_DAYS. Re-checks everything first. */
export async function deleteUnusedPhotos(): Promise<{ deleted: number; bytes: number }> {
  const { unused, unusedBytes } = await getPhotoCleanupReport();
  for (let i = 0; i < unused.length; i += 100) {
    const { error } = await db().storage.from(PHOTOS_BUCKET).remove(unused.slice(i, i + 100).map((p) => p.name));
    if (error) throw new Error(`Could not delete photos: ${error.message}`);
  }
  return { deleted: unused.length, bytes: unusedBytes };
}

/** Which of these photo files no longer exist (e.g. cleaned up before the customer booked). */
export async function missingPhotos(files: string[]): Promise<string[]> {
  const checks = await Promise.all(
    [...new Set(files)].map(async (f) => {
      const { data, error } = await db().storage.from(PHOTOS_BUCKET).exists(f);
      if (data) return null;
      // "Not found" answers mean the photo is gone; anything else is a real failure.
      const status = (error as { status?: number } | null)?.status;
      if (error && status !== 400 && status !== 404) throw new Error(`Could not check photos: ${error.message}`);
      return f;
    }),
  );
  return checks.filter((f): f is string => f !== null);
}
