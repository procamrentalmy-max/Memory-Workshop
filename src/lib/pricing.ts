import { collagePhotos } from "./collage";
import { DRINKS, INCLUDED_SHEETS_PER_PERSON, PRICING } from "./data";
import { sheetPhotos } from "./shapes";
import type { Order, OrderPage } from "./types";

/** RM24 per person for a 1-hour session (extra time is added at the studio). */
export function sessionEstimate(people: number) {
  return people * PRICING.session;
}

/** Photos on a photo page (one A4 sheet). */
export function photoCount(p: OrderPage) {
  return p.kind === "collage" ? collagePhotos(p.collage.root).length : sheetPhotos(p.sheet).length;
}

/** What a photo sheet costs if it isn't one of the included ones. */
export const extraSheetPrice = (p: OrderPage) => photoCount(p) * PRICING.photoPrint;

/**
 * Photo prints: each person's first A4 sheet is included in the session (the dearest sheets count as the
 * included ones); further sheets are RM1.50 per photo.
 */
export function photoPrintsPrice(pages: OrderPage[], people: number) {
  const included = people * INCLUDED_SHEETS_PER_PERSON;
  return pages
    .map(extraSheetPrice)
    .sort((a, b) => b - a)
    .slice(included)
    .reduce((sum, x) => sum + x, 0);
}

/** Drinks pre-ordered with a booking are at the session price. */
export const drinkPrice = (name: string) => DRINKS.find((d) => d.name === name)?.sessionPrice ?? 0;

export function orderTotals(order: Order) {
  const people = order.visit?.people ?? 1;
  const session = order.visit ? sessionEstimate(order.visit.people) : 0;
  const pages = photoPrintsPrice(order.pages, people);
  const drinks = Object.entries(order.drinks).reduce((sum, [name, qty]) => sum + drinkPrice(name) * qty, 0);
  return { session, pages, drinks, total: session + pages + drinks };
}
