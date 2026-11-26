"use server";

import { ARRIVAL_TIMES, DRINKS, PACKAGE_IDS } from "@/lib/data";
import { orderTotals, peopleCount } from "@/lib/pricing";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { addBooking, missingPhotos } from "@/lib/store";
import { cleanPhotoPage, num } from "@/lib/sanitise";
import type { Order, OrderPage } from "@/lib/types";

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; reference: string; name: string; total: number; payment: string; date: string; time: string; people: number };

const PAYMENT_METHODS = { studio: "Pay at the studio" } as const;

function klNow() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Rebuild the order from trusted data: prices always come from the server, never the browser. */
async function sanitiseOrder(raw: unknown): Promise<Order | string> {
  const o = raw as Partial<Order>;
  const v = o?.visit;
  if (!v || typeof v.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return "Please choose your visit date.";
  if (!ARRIVAL_TIMES.includes(v.time)) return "Please choose an arrival time.";
  const now = klNow();
  if (v.date < now.date || (v.date === now.date && v.time <= now.time)) return "That arrival time has already passed. Please choose another.";
  if (new Date(`${v.date}T00:00:00Z`).getUTCDay() === 1) return "The studio is closed on Mondays.";
  // One package per person: the number of people comes from the packages.
  const packages: Record<string, number> = {};
  for (const [id, q] of Object.entries(o.packages ?? {})) {
    const n = Math.round(num(q, 0, 12));
    if (n > 0 && PACKAGE_IDS.includes(id as never)) packages[id] = n;
  }
  const people = peopleCount({ packages });
  if (people < 1) return "Please choose a package with studio time (the Badge workshop is added to one).";
  if (people > 12) return "For more than 12 people, please email us and we'll set it up.";

  // Photo pages (photo collage / photo shapes) only, rebuilt from trusted values.
  const pages: OrderPage[] = [];
  for (const p of Array.isArray(o.pages) ? o.pages.slice(0, 50) : []) {
    const page = cleanPhotoPage(p, String((p as { id?: unknown })?.id ?? "").slice(0, 20));
    if (page) pages.push(page);
  }

  const drinks: Record<string, number> = {};
  for (const [name, q] of Object.entries(o.drinks ?? {})) {
    const n = Math.round(num(q, 0, 20));
    if (n > 0 && DRINKS.some((d) => d.name === name)) drinks[name] = n;
  }
  const order: Order = { packages, visit: { date: v.date, time: v.time, people }, pages, drinks };
  // Every photo must still be stored, so the studio can print it.
  if ((await missingPhotos(orderPhotoFiles(order))).length) {
    return "One or more of your photos couldn't be found (photos are kept for a while before booking). Please add them again on the pages step, then book.";
  }
  return order;
}

export async function placeBooking(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 1000);
  const paymentKey = String(formData.get("payment") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Please enter a valid email.";
  if (phone.replace(/\D/g, "").length < 8) fieldErrors.phone = "Please enter a valid phone number.";
  if (!(paymentKey in PAYMENT_METHODS)) fieldErrors.payment = "Please choose how you'd like to pay.";
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Please check the highlighted fields.", fieldErrors };

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("order") ?? ""));
  } catch {
    return { status: "error", message: "Something went wrong with your order. Please start again." };
  }
  let order: Order | string;
  try {
    order = await sanitiseOrder(parsed);
  } catch (e) {
    console.error(e);
    return { status: "error", message: "We couldn't reach our booking system. Please try again in a moment." };
  }
  if (typeof order === "string") return { status: "error", message: order };

  // TODO: once seating capacity is known (SEATING.seats), check overlapping 1.5 hr bookings here.

  const totals = orderTotals(order);
  const payment = PAYMENT_METHODS[paymentKey as keyof typeof PAYMENT_METHODS];
  let reference: string;
  try {
    reference = await addBooking({ name, email, phone, notes, payment, order, totals });
  } catch (e) {
    console.error(e);
    return { status: "error", message: "We couldn't save your booking. Please try again in a moment." };
  }

  const { date, time, people } = order.visit!;
  return { status: "success", reference, name, total: totals.total, payment, date, time, people };
}
