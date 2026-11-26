// Server-only data access: bookings, customer photos and site settings, stored in Supabase.
import { PHOTOS_BUCKET, SITE_FILES_BUCKET, db } from "./supabase";
import type { CafeMenu, Order } from "./types";

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
  printedAt?: string | null; // the worker printed the order's photos
  settledAt?: string | null; // the customer paid and left; their photos are deleted
  visitDate?: string; // YYYY-MM-DD (for in-store orders: the day it was sent)
  arrivalTime?: string; // HH:MM (for in-store orders: when it was sent)
  walkIn?: boolean; // sent to print from the studio, paid at the counter
  tableLabel?: string | null; // in-store orders: where the customer is sitting
};

type BookingRow = {
  reference: string; created_at: string; name: string; email: string; phone: string; notes: string;
  payment: string; order: Order; totals: Booking["totals"]; printed_at: string | null; settled_at: string | null;
  visit_date: string; arrival_time: string; walk_in: boolean; table_label: string | null;
};
const BOOKING_COLUMNS = "reference,created_at,name,email,phone,notes,payment,order,totals,printed_at,settled_at,visit_date,arrival_time,walk_in,table_label";
const toBooking = ({ created_at, printed_at, settled_at, visit_date, arrival_time, walk_in, table_label, ...r }: BookingRow): Booking => ({
  ...r, createdAt: created_at, printedAt: printed_at, settledAt: settled_at,
  visitDate: visit_date, arrivalTime: arrival_time.slice(0, 5), walkIn: walk_in, tableLabel: table_label,
});

export async function getBookings(limit = 200): Promise<Booking[]> {
  const { data, error } = await db()
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load bookings: ${error.message}`);
  return (data as BookingRow[]).map(toBooking);
}

/** The worker page: orders still open (bill not settled), earliest visit first, and the latest settled ones. */
export async function getWorkerOrders(): Promise<{ open: Booking[]; settled: Booking[] }> {
  const [open, settled] = await Promise.all([
    db().from("bookings").select(BOOKING_COLUMNS).is("settled_at", null)
      .order("visit_date", { ascending: true }).order("arrival_time", { ascending: true }).limit(200),
    db().from("bookings").select(BOOKING_COLUMNS).not("settled_at", "is", null)
      .order("settled_at", { ascending: false }).limit(15),
  ]);
  if (open.error || settled.error) throw new Error(`Could not load orders: ${(open.error ?? settled.error)!.message}`);
  return { open: (open.data as BookingRow[]).map(toBooking), settled: (settled.data as BookingRow[]).map(toBooking) };
}

export async function setPrinted(reference: string, printed: boolean) {
  const { error } = await db().from("bookings").update({ printed_at: printed ? new Date().toISOString() : null }).eq("reference", reference);
  if (error) throw new Error(`Could not update the order: ${error.message}`);
}

/** The customer has paid and left: mark the bill settled and delete their photos straight away. */
export async function settleBooking(reference: string): Promise<{ deleted: number }> {
  const { error } = await db().from("bookings").update({ settled_at: new Date().toISOString() }).eq("reference", reference).is("settled_at", null);
  if (error) throw new Error(`Could not update the order: ${error.message}`);
  const { deleted } = await deleteExpiredPhotos();
  return { deleted };
}

/** Saves a booking row under a new random reference like PM-3F9A1C. */
async function insertWithReference(row: Record<string, unknown>): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = `PM-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    const { error } = await db().from("bookings").insert({ reference, ...row });
    if (!error) return reference;
    if (error.code !== "23505") throw new Error(`Could not save the order: ${error.message}`); // 23505 = duplicate reference
  }
  throw new Error("Could not create a reference. Please try again.");
}

/** An in-store customer sends photo pages to print. No booking: they pay at the counter. */
export async function addWalkIn(w: { name: string; tableLabel: string; order: Order; totals: Booking["totals"] }): Promise<string> {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return insertWithReference({
    name: w.name,
    email: "",
    phone: "",
    notes: "",
    payment: "Pay at the counter",
    visit_date: `${get("year")}-${get("month")}-${get("day")}`,
    arrival_time: `${get("hour")}:${get("minute")}`,
    people: 1,
    order: w.order,
    totals: w.totals,
    total: w.totals.total,
    walk_in: true,
    table_label: w.tableLabel || null,
  });
}

/* ───────── In-store QR code ─────────
 * The table QR code opens the photo pages with this code, which lets customers send pages to print.
 * Changing it (admin page) stops old QR codes from working.
 */
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31]).join("");

export async function getStudioCode(): Promise<string> {
  const { data, error } = await db().from("site_settings").select("value").eq("key", "studio_code").maybeSingle();
  if (error) throw new Error(`Could not load the studio code: ${error.message}`);
  const code = (data?.value as { code?: string } | undefined)?.code;
  return code ?? newStudioCode();
}

export async function newStudioCode(): Promise<string> {
  const code = newCode();
  const { error } = await db().from("site_settings").upsert({ key: "studio_code", value: { code }, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Could not save the studio code: ${error.message}`);
  return code;
}

export async function addBooking(b: Omit<Booking, "reference" | "createdAt">): Promise<string> {
  const visit = b.order.visit!;
  return insertWithReference({
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

/* ───────── Customer photos: retention ─────────
 * The rules live in the database function customer_photo_status():
 *   booked        in a booking whose bill isn't settled yet -> kept for printing
 *   session_over  the bill is settled (or the day after the visit is over) -> deleted
 *   draft         not booked, used in the last PHOTO_KEEP_DAYS days -> kept
 *   abandoned     not booked and untouched for PHOTO_KEEP_DAYS days -> deleted
 * Settling a bill on the worker page deletes that order's photos at once; photos a customer replaces
 * or discards are released by their browser straight away. An hourly Supabase job (edge function
 * "cleanup-photos") deletes anything else that has expired.
 */

/** Must match the 7 days in customer_photo_status() in the database. */
export const PHOTO_KEEP_DAYS = 7;

type PhotoStatusRow = { file: string; bytes: number; status: "booked" | "session_over" | "draft" | "abandoned"; expires_at: string };

export type PhotoCleanupReport = {
  total: number;
  totalBytes: number;
  booked: number; // in an order whose bill isn't settled yet
  drafts: number; // not booked yet, used recently
  expired: { name: string; size: number }[]; // bill settled / visit over, or untouched draft: will be deleted
  expiredBytes: number;
};

export async function getPhotoCleanupReport(): Promise<PhotoCleanupReport> {
  const { data, error } = await db().rpc("customer_photo_status");
  if (error) throw new Error(`Could not check photos: ${error.message}`);
  const report: PhotoCleanupReport = { total: 0, totalBytes: 0, booked: 0, drafts: 0, expired: [], expiredBytes: 0 };
  for (const r of data as PhotoStatusRow[]) {
    const bytes = Number(r.bytes);
    report.total++;
    report.totalBytes += bytes;
    if (r.status === "booked") report.booked++;
    else if (r.status === "draft") report.drafts++;
    else {
      report.expired.push({ name: r.file, size: bytes });
      report.expiredBytes += bytes;
    }
  }
  return report;
}

/** Deletes expired photos (re-checked against the rules first). The hourly job does the same automatically. */
export async function deleteExpiredPhotos(): Promise<{ deleted: number; bytes: number }> {
  const { expired, expiredBytes } = await getPhotoCleanupReport();
  for (let i = 0; i < expired.length; i += 100) {
    const names = expired.slice(i, i + 100).map((p) => p.name);
    const { error } = await db().storage.from(PHOTOS_BUCKET).remove(names);
    if (error) throw new Error(`Could not delete photos: ${error.message}`);
    await db().from("customer_photos").delete().in("file", names);
  }
  return { deleted: expired.length, bytes: expiredBytes };
}

/** Records that these photos were just used, so unbooked drafts are kept for another PHOTO_KEEP_DAYS days. */
export async function touchPhotos(files: string[]): Promise<number> {
  if (files.length === 0) return 0;
  const { data, error } = await db().rpc("touch_customer_photos", { files });
  if (error) throw new Error(`Could not update photos: ${error.message}`);
  return Number(data ?? 0);
}

/** Deletes photos a customer no longer uses (replaced, removed or discarded). Photos in a booking are never touched. */
export async function releasePhotos(files: string[]): Promise<number> {
  if (files.length === 0) return 0;
  const { data, error } = await db().rpc("unbooked_photos", { files });
  if (error) throw new Error(`Could not check photos: ${error.message}`);
  const free = (data as string[] | null) ?? [];
  if (free.length === 0) return 0;
  const removed = await db().storage.from(PHOTOS_BUCKET).remove(free);
  if (removed.error) throw new Error(`Could not delete photos: ${removed.error.message}`);
  await db().from("customer_photos").delete().in("file", free);
  return free.length;
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
