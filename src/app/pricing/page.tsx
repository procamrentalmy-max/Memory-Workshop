import type { Metadata } from "next";
import Link from "next/link";
import { BADGES, BRACELETS, DRINKS, EXTRA_TIME_RULE, NFC_PRICES, NFC_RULE, PACKAGES, PASTRIES, PRICING, SEED_COUPON, SHOP, formatRM, priceLabel } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Workshop packages from RM8: Basic, Memory Maker, Complete Memory and the Memory Badge workshop. A bracelet, supplies, water and pastry tastings are free.",
};

const TAPES = ["#c4553a", "#e0a93b", "#7d9a7e", "#3d5a80", "#5e3c2b"];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">simple &amp; affordable</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Pricing</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        One package per person. In every workshop, each person makes one bracelet free, and a huge selection of cutters,
        ribbons, tapes and accessories is free too, with free water and a pastry tasting every 30 minutes.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PACKAGES.map((p, i) => (
          <section key={p.id} className="relative flex flex-col rounded-2xl bg-card p-7 shadow-sm">
            <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: TAPES[i % TAPES.length] }} />
            <h2 className="font-display text-2xl font-semibold">{p.name}</h2>
            <p className="mt-3 font-display text-4xl font-semibold">{formatRM(p.price)}</p>
            <p className="text-sm text-ink-soft">per person</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {p.includes.map((x) => (
                <li key={x} className="flex gap-2"><span className="text-[#3f5e41]" aria-hidden>✓</span>{x}</li>
              ))}
            </ul>
            {(p.typical || p.note) && <p className="mt-3 text-xs text-ink-soft">{p.typical ?? p.note}</p>}
          </section>
        ))}
        <section className="relative flex flex-col rounded-2xl bg-paper-2 p-7">
          <h2 className="font-display text-2xl font-semibold">Extra time</h2>
          <p className="mt-3 font-display text-4xl font-semibold">{formatRM(PRICING.extraHalfHour)}</p>
          <p className="text-sm text-ink-soft">per 30 minutes</p>
          <p className="mt-4 text-sm">{EXTRA_TIME_RULE}</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 rotate-3" style={{ ["--tape" as string]: "#7d9a7e" }} />
          <h2 className="font-display text-2xl font-semibold">Badges, NFC &amp; bracelets</h2>
          <ul className="mt-4 divide-y divide-dashed divide-line text-sm">
            {BADGES.map((b) => (
              <li key={b.name} className="flex items-baseline justify-between gap-4 py-2">
                <span>{b.name}{b.note && <span className="block text-xs text-ink-soft">{b.note}</span>}</span>
                <span className="font-semibold">{formatRM(b.price)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-semibold">NFC, added to a badge (badge price separate)</h3>
          <ul className="mt-1 divide-y divide-dashed divide-line text-sm">
            {NFC_PRICES.map((n) => (
              <li key={n.name} className="flex items-baseline justify-between gap-4 py-2">
                <span>{n.name}</span>
                <span className="font-semibold">{formatRM(n.price)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-soft">{NFC_RULE}</p>
          <h3 className="mt-5 text-sm font-semibold">Bracelets</h3>
          <ul className="mt-1 divide-y divide-dashed divide-line text-sm">
            {BRACELETS.map((b) => (
              <li key={b.name} className="flex items-baseline justify-between gap-4 py-2">
                <span>{b.name}{b.note && <span className="block text-xs text-ink-soft">{b.note}</span>}</span>
                <span className="font-semibold">{priceLabel(b)}</span>
              </li>
            ))}
          </ul>
        </section>
        {SHOP.map((g) => (
          <section key={g.group} className="relative rounded-2xl bg-card p-8 shadow-sm">
            <span className="washi -top-2 left-8 -rotate-2" style={{ ["--tape" as string]: "#3d5a80" }} />
            <h2 className="font-display text-2xl font-semibold">{g.group}</h2>
            <ul className="mt-4 divide-y divide-dashed divide-line text-sm">
              {g.items.map((item) => (
                <li key={item.name} className="flex items-baseline justify-between gap-4 py-2">
                  <span>{item.name}</span>
                  <span className="font-semibold">{formatRM(item.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">
              Photo sheets you design on our <Link href="/collage" className="underline">Photo Collage page</Link> print as A4
              photo prints; those in your package are included.
            </p>
          </section>
        ))}
      </div>

      <section className="relative mt-6 rounded-2xl bg-card p-8 shadow-sm">
        <span className="washi -top-2 left-8 -rotate-2" style={{ ["--tape" as string]: "#5e3c2b" }} />
        <h2 className="font-display text-2xl font-semibold">Café</h2>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-soft">
              <tr><th className="py-1.5 font-semibold">Drink</th><th className="py-1.5 text-right font-semibold">Regular</th><th className="py-1.5 text-right font-semibold">With a workshop</th></tr>
            </thead>
            <tbody>
              {DRINKS.map((d) => (
                <tr key={d.name} className="border-t border-dashed border-line">
                  <td className="py-2">{d.name}</td>
                  <td className="py-2 text-right">{d.price === null ? "—" : formatRM(d.price)}</td>
                  <td className="py-2 text-right font-semibold">{formatRM(d.sessionPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <ul className="divide-y divide-dashed divide-line text-sm">
              {PASTRIES.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-4 py-2">
                  <span>{p.name}</span>
                  <span className="font-semibold">{priceLabel(p)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-soft">{SEED_COUPON}</p>
          </div>
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link href="/book" className="btn btn-primary">Book a workshop</Link>
      </div>
    </div>
  );
}
