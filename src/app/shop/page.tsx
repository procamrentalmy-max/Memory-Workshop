import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BADGES, DRINKS, FREE_SUPPLIES, PASTRIES, SEED_COUPON, SHOP, formatRM } from "@/lib/data";
import { getCafeMenu } from "@/lib/store";
import { siteFileSrc, type CafeMenu } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop & Café",
  description: "Unlimited stationery, snacks and water with every session, plus badges, NFC tags, notebooks, coffee and pastries at the studio.",
};

function CafeList() {
  return (
    <>
      <ul className="mt-5 divide-y divide-dashed divide-line">
        {DRINKS.map((d) => (
          <li key={d.name} className="flex items-baseline justify-between gap-4 py-2.5">
            <span>{d.name}</span>
            <span className="text-right">
              <span className="font-semibold">{formatRM(d.price)}</span>
              {d.sessionPrice < d.price && <span className="block text-xs text-ink-soft">{formatRM(d.sessionPrice)} with a session</span>}
            </span>
          </li>
        ))}
        {PASTRIES.map((p) => (
          <li key={p.name} className="flex items-baseline justify-between gap-4 py-2.5">
            <span>{p.name}</span>
            <span className="font-semibold">{formatRM(p.price)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-sage/15 p-3 text-sm">🌱 {SEED_COUPON}</p>
    </>
  );
}

/** The full café menu PDF, when one has been uploaded in the admin page. */
async function CafeMenuLink() {
  await connection();
  let menu: CafeMenu | null = null;
  try {
    menu = await getCafeMenu();
  } catch (e) {
    console.error(e);
  }
  if (!menu) return null;
  return (
    <a href={siteFileSrc(menu.file)} target="_blank" rel="noreferrer" className="btn btn-primary mt-5">
      View the full café menu (PDF)
    </a>
  );
}

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">finishing touches</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Shop &amp; café</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">Everything you need to fill your scrapbook, and something nice to sip while you do.</p>

      {/* Free with every session */}
      <section className="relative mt-10 overflow-hidden rounded-2xl bg-sage/15 p-7 ring-1 ring-sage/40 sm:p-9">
        <span className="absolute -right-3 top-6 rotate-12 rounded-md bg-accent px-4 py-1 font-display text-lg font-bold text-accent-ink shadow">FREE</span>
        <p className="font-hand text-2xl text-[#3f5e41]">included with every session</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">Unlimited stationery, snacks &amp; water</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Use as many papers, stickers, ribbons and cutters as you like while you create, with free-flow snacks and water.
          No extra charge, no counting.
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
        <section className="relative rounded-2xl bg-card p-7 pt-9 shadow-sm">
          <span className="washi -top-2 left-8 rotate-3" style={{ ["--tape" as string]: "#c4553a" }} />
          <h2 className="font-display text-2xl font-semibold">Badges &amp; NFC tags</h2>
          <p className="mt-1 text-sm text-ink-soft">Tap an NFC badge with any phone to play your music or video. No app needed.</p>
          <ul className="mt-5 divide-y divide-dashed divide-line">
            {BADGES.map((b) => (
              <li key={b.name} className="flex items-baseline justify-between gap-4 py-2.5">
                <span>{b.name}{b.note && <span className="block text-xs text-ink-soft">{b.note}</span>}</span>
                <span className="font-semibold">{formatRM(b.price)}</span>
              </li>
            ))}
          </ul>
        </section>

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
          <p className="mt-1 text-sm text-ink-soft">Fuel for creativity, made fresh at the studio bar. Drinks are cheaper added to a session.</p>
          <CafeList />
          <Suspense fallback={null}>
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
