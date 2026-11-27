"use client";

import { EXTRA_TIME_RULE, PRICING, formatRM, to12h } from "@/lib/data";
import { drinkPrice, includedSheets, orderPackages, orderTotals, photoCount } from "@/lib/pricing";
import type { Order } from "@/lib/types";

export function OrderSummary({ order, children }: { order: Order; children?: React.ReactNode }) {
  const t = orderTotals(order);
  const drinkLines = Object.entries(order.drinks).filter(([, q]) => q > 0);
  const packages = orderPackages(order);
  const included = Math.min(order.pages.length, includedSheets(order));
  return (
    <div className="relative rounded-2xl bg-card p-6 shadow-sm">
      <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#7d9a7e" }} />
      <h2 className="font-display text-xl font-semibold">Your order</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Packages</dt>
            <dd className="font-semibold">{packages.length ? formatRM(t.session) : "—"}</dd>
          </div>
          <ul className="text-xs text-ink-soft">
            {packages.map(([p, q]) => (
              <li key={p.id}>{q} × {p.name} · {formatRM(p.price * q)}</li>
            ))}
          </ul>
          {order.visit?.date && order.visit.time && (
            <p className="text-xs text-ink-soft">
              {new Date(`${order.visit.date}T00:00:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}, arriving {to12h(order.visit.time)}
            </p>
          )}
        </div>
        {order.pages.length > 0 && (
          <div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Photo prints · {order.pages.length} sheet{order.pages.length === 1 ? "" : "s"}</dt>
              <dd className="font-semibold">{t.pages ? formatRM(t.pages) : "Included"}</dd>
            </div>
            <ul className="text-xs text-ink-soft">
              {order.pages.map((p) => (
                <li key={p.id}>{p.kind === "collage" ? "Photo collage" : "Photo shapes"} · {photoCount(p)} photo{photoCount(p) === 1 ? "" : "s"}</li>
              ))}
              <li>
                {included} included in your packages
                {order.pages.length > included ? `, ${order.pages.length - included} extra at ${formatRM(PRICING.photoSheet)}` : ""}
              </li>
            </ul>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">A bracelet each, stationery, water &amp; pastry tasting</dt>
          <dd className="font-semibold text-[#3f5e41]">Free</dd>
        </div>
        {drinkLines.length > 0 && (
          <div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Drinks</dt>
              <dd className="font-semibold">{formatRM(t.drinks)}</dd>
            </div>
            <ul className="text-xs text-ink-soft">
              {drinkLines.map(([n, q]) => (
                <li key={n}>{q} × {n} · {formatRM(drinkPrice(n) * q)}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3">
          <dt className="font-semibold">Estimated total</dt>
          <dd className="font-display text-2xl font-semibold">{formatRM(t.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-ink-soft">{EXTRA_TIME_RULE} Extra time and NFC upgrades are paid at the studio.</p>
      {children}
    </div>
  );
}
