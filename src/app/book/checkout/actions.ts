"use server";

import { ARRIVAL_TIMES, DRINKS, TEMPLATES } from "@/lib/data";
import { orderTotals } from "@/lib/pricing";
import { addBooking, getElementsByIds } from "@/lib/store";
import { elementBox } from "@/lib/pageSize";
import { type CanvasItem, type Order, type OrderPage } from "@/lib/types";

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; reference: string; name: string; total: number; payment: string; date: string; time: string; people: number };

const PAYMENT_METHODS = { studio: "Pay at the studio" } as const;

const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const color = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#ffffff");

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
  const people = Math.round(num(v.people, 1, 12));

  const ids = (Array.isArray(o.pages) ? o.pages : []).flatMap((p) =>
    p?.kind === "custom" && Array.isArray(p.items) ? p.items.filter((i) => i?.type === "image").map((i) => String((i as { elementId: unknown }).elementId)) : [],
  );
  const elements = await getElementsByIds([...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/.test(id)));
  const pages: OrderPage[] = [];
  for (const p of Array.isArray(o.pages) ? o.pages.slice(0, 100) : []) {
    const id = String(p?.id ?? "").slice(0, 20);
    if (p?.kind === "preset") {
      if (TEMPLATES.some((t) => t.id === p.templateId)) pages.push({ kind: "preset", id, templateId: p.templateId });
    } else if (p?.kind === "custom" && Array.isArray(p.items)) {
      const items: CanvasItem[] = [];
      for (const it of p.items.slice(0, 200)) {
        const box = { id: String(it.id).slice(0, 20), x: num(it.x, -200, 200), y: num(it.y, -200, 200), w: num(it.w, 1, 200), h: num(it.h, 1, 200) };
        if (it.type === "image") {
          const el = elements.find((e) => e.id === it.elementId);
          if (!el) return `An element on one of your pages ("${String(it.name).slice(0, 40)}") is no longer available. Please remove it.`;
          // Elements always keep their own size; only their position comes from the customer.
          const { w, h } = elementBox(el.widthCm, el.heightCm);
          const x = Math.min(Math.max(box.x, 0), Math.max(0, 100 - w));
          const y = Math.min(Math.max(box.y, 0), Math.max(0, 100 - h));
          items.push({ id: box.id, x, y, w, h, type: "image", elementId: el.id, file: el.file, name: el.name, price: el.price, aspect: el.height / el.width });
        } else if (it.type === "section") {
          items.push({ ...box, type: "section", color: color(it.color) });
        } else if (it.type === "text") {
          const font = ["hand", "display", "sans"].includes(it.font) ? it.font : "hand";
          items.push({ ...box, type: "text", text: String(it.text ?? "").slice(0, 300), color: color(it.color), size: num(it.size, 1, 20), font });
        }
      }
      if (items.length) pages.push({ kind: "custom", id, items, background: color(p.background) });
    }
  }

  const drinks: Record<string, number> = {};
  for (const [name, q] of Object.entries(o.drinks ?? {})) {
    const n = Math.round(num(q, 0, 20));
    if (n > 0 && DRINKS.some((d) => d.name === name)) drinks[name] = n;
  }
  return { visit: { date: v.date, time: v.time, people }, pages, drinks };
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
