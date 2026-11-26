import { collagePhotos } from "./collage";
import { DRINKS, PRICING, packageById } from "./data";
import { sheetPhotos } from "./shapes";
import type { Order, OrderPage } from "./types";

/** Packages in an order, as [package, quantity] pairs (unknown ids ignored). */
export function orderPackages(order: Pick<Order, "packages">) {
  return Object.entries(order.packages ?? {}).flatMap(([id, q]) => {
    const pkg = packageById(id);
    return pkg && q > 0 ? [[pkg, q] as const] : [];
  });
}

/** One package per person. */
export const peopleCount = (order: Pick<Order, "packages">) => orderPackages(order).reduce((n, [, q]) => n + q, 0);

export const packagesTotal = (order: Pick<Order, "packages">) => orderPackages(order).reduce((sum, [p, q]) => sum + p.price * q, 0);

/** A4 photo sheets included in the packages (Memory Maker 1, Complete Memory 2). */
export const includedSheets = (order: Pick<Order, "packages">) => orderPackages(order).reduce((n, [p, q]) => n + p.sheets * q, 0);

/** Photos on a photo page (one A4 sheet). */
export function photoCount(p: OrderPage) {
  return p.kind === "collage" ? collagePhotos(p.collage.root).length : sheetPhotos(p.sheet).length;
}

/** Photo sheets beyond those in the packages are an A4 photo print each. */
export const extraSheetsPrice = (sheets: number, included: number) => Math.max(0, sheets - included) * PRICING.photoSheet;

/** Drinks pre-ordered with a booking are at the workshop price. */
export const drinkPrice = (name: string) => DRINKS.find((d) => d.name === name)?.sessionPrice ?? 0;

export function orderTotals(order: Order) {
  const session = packagesTotal(order);
  const pages = extraSheetsPrice(order.pages.length, includedSheets(order));
  const drinks = Object.entries(order.drinks).reduce((sum, [name, qty]) => sum + drinkPrice(name) * qty, 0);
  return { session, pages, drinks, total: session + pages + drinks };
}
