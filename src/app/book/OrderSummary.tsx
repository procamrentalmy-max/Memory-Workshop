"use client";

import { DRINKS, PRICING, SESSION_HOURS, TEMPLATES, formatRM, to12h } from "@/lib/data";
import { customPagePrice, orderTotals } from "@/lib/pricing";
import type { Order } from "@/lib/types";

export function OrderSummary({ order, children }: { order: Order; children?: React.ReactNode }) {
  const t = orderTotals(order);
  const drinkLines = Object.entries(order.drinks).filter(([, q]) => q > 0);
  return (
    <div className="relative rounded-2xl bg-card p-6 shadow-sm">
      <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#7d9a7e" }} />
      <h2 className="font-display text-xl font-semibold">Your order</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {order.visit && (
          <div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Session · {order.visit.people} × {SESSION_HOURS} hr × {formatRM(PRICING.sessionPerPersonPerHour)}</dt>
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
            <dt className="text-ink-soft">Pages · {order.pages.length}</dt>
            <dd className="font-semibold">{formatRM(t.pages)}</dd>
          </div>
          <ul className="text-xs text-ink-soft">
            {order.pages.map((p) => (
              <li key={p.id}>
                {p.kind === "preset"
                  ? `${TEMPLATES.find((x) => x.id === p.templateId)?.name} · ${formatRM(PRICING.perPage)}`
                  : `Your own design · ${formatRM(customPagePrice(p.items))}`}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Stickers &amp; stationery</dt>
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
                <li key={n}>{q} × {n} · {formatRM((DRINKS.find((d) => d.name === n)?.price ?? 0) * q)}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3">
          <dt className="font-semibold">Estimated total</dt>
          <dd className="font-display text-2xl font-semibold">{formatRM(t.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-ink-soft">Session time is estimated at {SESSION_HOURS} hours and charged by the hour.</p>
      {children}
    </div>
  );
}
