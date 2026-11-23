import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DRINKS, FREE_SUPPLIES, SHOP, formatRM } from "@/lib/data";
import { getCafeMenu } from "@/lib/store";
import { siteFileSrc, type CafeMenu } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop & Café",
  description: "Free stickers and stationery with every session, plus notebooks, scrapbook albums and fresh coffee at the studio.",
};

function DrinksList() {
  return (
    <ul className="mt-5 divide-y divide-dashed divide-line">
      {DRINKS.map((d) => (
        <li key={d.name} className="flex items-baseline justify-between gap-4 py-2.5">
          <span>{d.name}</span>
          <span className="font-semibold">{formatRM(d.price)}</span>
        </li>
      ))}
    </ul>
  );
}

async function CafeMenuLink() {
  await connection();
  let menu: CafeMenu | null = null;
  try {
    menu = await getCafeMenu();
  } catch (e) {
    console.error(e); // fall back to the drinks list
  }
  if (!menu) return <DrinksList />;
  return (
    <div className="mt-5">
      <a href={siteFileSrc(menu.file)} target="_blank" rel="noreferrer" className="btn btn-primary">
        View our café menu (PDF)
      </a>
      <p className="mt-3 text-sm text-ink-soft">Opens in a new tab. You can also pre-order a drink when you book.</p>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">finishing touches</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Shop &amp; café</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">Everything you need to finish your pages, and something nice to sip while you do.</p>

      {/* Free with every session */}
      <section className="relative mt-10 overflow-hidden rounded-2xl bg-sage/15 p-7 ring-1 ring-sage/40 sm:p-9">
        <span className="absolute -right-3 top-6 rotate-12 rounded-md bg-accent px-4 py-1 font-display text-lg font-bold text-accent-ink shadow">FREE</span>
        <p className="font-hand text-2xl text-[#3f5e41]">included with every session</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">Free stickers &amp; stationery</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Use as many stickers, washi tapes, pens and stamps as you like while you create. No extra charge, no counting.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {FREE_SUPPLIES.map((g) => (
            <div key={g.group}>
              <h3 className="font-display text-xl font-semibold">{g.group}</h3>
              <ul className="mt-2 space-y-1.5">
                {g.items.map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="text-[#3f5e41]" aria-hidden>✓</span>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {SHOP.map((g) => (
          <section key={g.group} className="relative rounded-2xl bg-card p-7 pt-9 shadow-sm">
            <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#7d9a7e" }} />
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

        <section className="relative rounded-2xl bg-card p-7 pt-9 shadow-sm">
          <span className="washi -top-2 left-8 rotate-2" style={{ ["--tape" as string]: "#5e3c2b" }} />
          <h2 className="font-display text-2xl font-semibold">Café</h2>
          <p className="mt-1 text-sm text-ink-soft">Fuel for creativity, made fresh at the studio bar.</p>
          <Suspense fallback={<p className="mt-5 text-sm text-ink-soft">Loading menu…</p>}>
            <CafeMenuLink />
          </Suspense>
        </section>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Prices are a guide and may change. <Link href="/book" className="font-semibold text-accent underline">Book a session</Link>
      </p>
    </div>
  );
}
