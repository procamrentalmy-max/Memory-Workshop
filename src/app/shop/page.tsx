import type { Metadata } from "next";
import { SHOP, formatRM } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shop & Café",
  description: "Stickers, stationery, notebooks, scrapbook albums and fresh coffee at the studio.",
};

const TAPES = ["#c4553a", "#e0a93b", "#7d9a7e", "#5e3c2b"];

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">finishing touches</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Shop &amp; café</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Available in the studio during your session. Prices shown are a guide and may change.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {SHOP.map((g, i) => (
          <section key={g.group} className="relative rounded-2xl bg-card p-7 pt-9 shadow-sm">
            <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: TAPES[i % TAPES.length] }} />
            <h2 className="font-display text-2xl font-semibold">{g.group}</h2>
            <p className="mt-1 text-sm text-ink-soft">{g.blurb}</p>
            <ul className="mt-5 divide-y divide-dashed divide-line">
              {g.items.map((item) => (
                <li key={item.name} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span>{item.name}</span>
                  <span className="font-semibold">{formatRM(item.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
