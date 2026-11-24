import { collagePhotos } from "./collage";
import { DRINKS, PRICING, SESSION_HOURS } from "./data";
import { sheetPhotos } from "./shapes";
import type { CanvasItem, Order, OrderPage } from "./types";

/** Only image elements cost money; sections and text boxes are free. */
export function customPagePrice(items: CanvasItem[]) {
  return PRICING.customPageBase + items.reduce((sum, it) => sum + (it.type === "image" ? it.price : 0), 0);
}

export function sessionEstimate(people: number) {
  return people * SESSION_HOURS * PRICING.sessionPerPersonPerHour;
}

export function orderTotals(order: Order) {
  const session = order.visit ? sessionEstimate(order.visit.people) : 0;
  const pages = order.pages.reduce((sum, p) => sum + pagePrice(p), 0);
  const drinks = Object.entries(order.drinks).reduce(
    (sum, [name, qty]) => sum + (DRINKS.find((d) => d.name === name)?.price ?? 0) * qty,
    0,
  );
  return { session, pages, drinks, total: session + pages + drinks };
}

/** Photo collage and photo shapes sheets are charged per photo printed. */
export function photoCount(p: OrderPage) {
  return p.kind === "collage" ? collagePhotos(p.collage.root).length : p.kind === "shapes" ? sheetPhotos(p.sheet).length : 0;
}

export function pagePrice(p: OrderPage) {
  if (p.kind === "preset") return PRICING.perPage;
  if (p.kind === "collage" || p.kind === "shapes") return photoCount(p) * PRICING.photoPrint;
  return customPagePrice(p.items);
}
