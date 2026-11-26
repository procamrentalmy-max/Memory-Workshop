"use client";

import Link from "next/link";
import { DRINKS, formatRM } from "@/lib/data";
import { orderTotals } from "@/lib/pricing";
import { ActionBar, nextBtn } from "../ActionBar";
import { OrderSummary } from "../OrderSummary";
import { setOrder, useOrder } from "../orderStore";

export default function DrinksStep() {
  const order = useOrder();
  if (!order) return <p className="text-ink-soft">Loading…</p>;

  const qty = (name: string) => order.drinks[name] ?? 0;
  const change = (name: string, delta: number) =>
    setOrder((o) => {
      const n = Math.max(0, Math.min(20, (o.drinks[name] ?? 0) + delta));
      const drinks = { ...o.drinks, [name]: n };
      if (n === 0) delete drinks[name];
      return { ...o, drinks };
    });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <p className="font-hand text-2xl text-accent">step three</p>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Choose your drink</h1>
        <p className="mt-3 text-ink-soft">
          Water is free, with a free pastry tasting every 30 minutes. Add a coffee to your workshop for less: made fresh at
          the studio bar and ready when you
          arrive. You can skip this and order at the studio.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {DRINKS.map((d) => (
            <li key={d.name} className={`flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 ${qty(d.name) ? "border-accent" : "border-line"}`}>
              <div>
                <p className="font-display text-xl font-semibold">{d.name}</p>
                <p className="text-sm">
                  <strong>{formatRM(d.sessionPrice)}</strong>
                  {d.sessionPrice < d.price && <span className="ml-2 text-ink-soft line-through">{formatRM(d.price)}</span>}
                </p>
              </div>
              <div className="flex items-center rounded-full border border-line">
                <button type="button" onClick={() => change(d.name, -1)} aria-label={`One less ${d.name}`} className="h-10 w-10 text-lg disabled:opacity-30" disabled={!qty(d.name)}>−</button>
                <span className="w-6 text-center font-semibold" aria-live="polite">{qty(d.name)}</span>
                <button type="button" onClick={() => change(d.name, 1)} aria-label={`One more ${d.name}`} className="h-10 w-10 text-lg">+</button>
              </div>
            </li>
          ))}
        </ul>

        <ActionBar
          back="/book/time"
          summary={<>Estimated total <strong className="ml-1 font-display text-xl">{formatRM(orderTotals(order).total)}</strong></>}
        >
          <Link href="/book/checkout" className={nextBtn}>
            {Object.keys(order.drinks).length ? <><span>Next<span className="hidden sm:inline">: your details</span> →</span></> : "Skip drinks →"}
          </Link>
        </ActionBar>
      </div>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <OrderSummary order={order} />
      </aside>
    </div>
  );
}
