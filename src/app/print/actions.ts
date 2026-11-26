"use server";

import { pagePrice } from "@/lib/pricing";
import { cleanPhotoPage } from "@/lib/sanitise";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { addWalkIn, getStudioCode, missingPhotos } from "@/lib/store";
import type { Order, OrderPage } from "@/lib/types";

export type PrintState =
  | { status: "idle" }
  | { status: "error"; message: string; field?: "name" }
  | { status: "success"; reference: string; name: string; total: number; photos: number; sentIds: string[] };

/** An in-store customer sends their photo pages to the worker page. They pay at the counter. */
export async function sendToPrint(_prev: PrintState, formData: FormData): Promise<PrintState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const table = String(formData.get("table") ?? "").trim().slice(0, 20);
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (name.length < 1) return { status: "error", message: "Please enter your name so we know whose prints these are.", field: "name" };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("pages") ?? "[]"));
  } catch {
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  const pages: OrderPage[] = [];
  for (const p of Array.isArray(raw) ? raw.slice(0, 20) : []) {
    const page = cleanPhotoPage(p, String((p as { id?: unknown })?.id ?? "").slice(0, 20));
    if (page && pagePrice(page) > 0) pages.push(page);
  }
  if (pages.length === 0) return { status: "error", message: "Add a photo page with at least one photo first." };

  try {
    if (code !== (await getStudioCode())) {
      return { status: "error", message: "This QR code has changed. Please scan the QR code on your table again, or ask our staff." };
    }
    const order: Order = { visit: null, pages, drinks: {} };
    if ((await missingPhotos(orderPhotoFiles(order))).length) {
      return { status: "error", message: "One of your photos couldn't be found. Please add it again, then send to print." };
    }
    const prints = pages.reduce((sum, p) => sum + pagePrice(p), 0);
    const reference = await addWalkIn({ name, tableLabel: table, order, totals: { session: 0, pages: prints, drinks: 0, total: prints } });
    return { status: "success", reference, name, total: prints, photos: orderPhotoFiles(order).length, sentIds: pages.map((p) => p.id) };
  } catch (e) {
    console.error(e);
    return { status: "error", message: "We couldn't send your pages. Please try again, or ask our staff." };
  }
}
