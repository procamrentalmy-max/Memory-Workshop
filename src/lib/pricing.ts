import { DRINKS, PRICING, SESSION_HOURS } from "./data";
import type { CanvasItem, Order } from "./types";

/** Only image elements cost money; sections and text boxes are free. */
export function customPagePrice(items: CanvasItem[]) {
  return PRICING.customPageBase + items.reduce((sum, it) => sum + (it.type === "image" ? it.price : 0), 0);
}

export function sessionEstimate(people: number) {
  return people * SESSION_HOURS * PRICING.sessionPerPersonPerHour;
}

export function orderTotals(order: Order) {
  const session = order.visit ? sessionEstimate(order.visit.people) : 0;
  const pages = order.pages.reduce(
    (sum, p) => sum + (p.kind === "preset" ? PRICING.perPage : customPagePrice(p.items)),
    0,
  );
  const drinks = Object.entries(order.drinks).reduce(
    (sum, [name, qty]) => sum + (DRINKS.find((d) => d.name === name)?.price ?? 0) * qty,
    0,
  );
  return { session, pages, drinks, total: session + pages + drinks };
}
