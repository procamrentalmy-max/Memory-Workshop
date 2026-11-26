"use client";

import { INCLUDED_SHEETS_PER_PERSON, PRICING, formatRM, to12h } from "@/lib/data";
import { drinkPrice, orderTotals, photoCount } from "@/lib/pricing";
import type { Order } from "@/lib/types";

export function OrderSummary({ order, children }: { order: Order; children?: React.ReactNode }) {
  const t = orderTotals(order);
  const drinkLines = Object.entries(order.drinks).filter(([, q]) => q > 0);
  const people = order.visit?.people ?? 1;
  const included = Math.min(order.pages.length, people * INCLUDED_SHEETS_PER_PERSON);
  return (
    <div className="relative rounded-2xl bg-card p-6 shadow-sm">
      <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#7d9a7e" }} />
      <h2 className="font-display text-xl font-semibold">Your order</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {order.visit && (
          <div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Session · {order.visit.people} × {formatRM(PRICING.session)}, 1 hour</dt>
              <dd className="font-semibold">{formatRM(t.session)}</dd>
            </div>
            <p className="text-xs text-ink-soft">
              {order.visit.date && order.visit.time
                ? `${new Date(`${order.visit.date}T00:00:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}, arriving ${to12h(order.visit.time)}`
                : "Choose a date and arrival time"}
            </p>
          </div>
        )}
        <div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Photo prints · {order.pages.length} sheet{order.pages.length === 1 ? "" : "s"}</dt>
            <dd className="font-semibold">{t.pages ? formatRM(t.pages) : order.pages.length ? "Included" : "—"}</dd>
          </div>
          <ul className="text-xs text-ink-soft">
            {order.pages.map((p) => (
              <li key={p.id}>{p.kind === "collage" ? "Photo collage" : "Photo shapes"} · {photoCount(p)} photo{photoCount(p) === 1 ? "" : "s"}</li>
            ))}
            {order.pages.length > 0 && (
              <li>{included} included{order.pages.length > included ? `, extra sheets ${formatRM(PRICING.photoPrint)} per photo` : ""}</li>
            )}
          </ul>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Badge, scrapbook, stationery, snacks &amp; water</dt>
          <dd className="font-semibold text-[#3f5e41]">Included</dd>
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
      <p className="mt-2 text-xs text-ink-soft">
        Want longer than an hour? Each extra 30 minutes is {formatRM(PRICING.extraHalfHour)}, added at the studio.
      </p>
      {children}
    </div>
  );
}
