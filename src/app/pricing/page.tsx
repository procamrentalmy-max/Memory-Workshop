import type { Metadata } from "next";
import Link from "next/link";
import { BADGES, DRINKS, PASTRIES, PRICING, SEED_COUPON, SESSION_INCLUDES, formatRM } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pricing",
  description: `One simple price: ${formatRM(PRICING.session)} per person for a 1-hour session with a scrapbook, a Memory Badge, two photo prints, unlimited stationery and free-flow snacks.`,
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">simple &amp; affordable</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Pricing</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">One price for your session, with everything you need included.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#c4553a" }} />
          <h2 className="font-display text-2xl font-semibold">Studio session</h2>
          <p className="mt-4 font-display text-5xl font-semibold">{formatRM(PRICING.session)}</p>
          <p className="text-ink-soft">per person · 1 hour</p>
          <ul className="mt-5 space-y-2">
            {SESSION_INCLUDES.map((x) => (
              <li key={x} className="flex gap-2"><span className="text-[#3f5e41]" aria-hidden>✓</span>{x}</li>
            ))}
          </ul>
        </section>
        <div className="grid gap-6">
          <section className="relative rounded-2xl bg-card p-8 shadow-sm">
            <span className="washi -top-2 left-8 rotate-3" style={{ ["--tape" as string]: "#e0a93b" }} />
            <h2 className="font-display text-2xl font-semibold">Extra time</h2>
            <p className="mt-4 font-display text-4xl font-semibold">{formatRM(PRICING.extraHalfHour)}</p>
            <p className="text-ink-soft">for every extra 30 minutes</p>
          </section>
          <section className="relative rounded-2xl bg-card p-8 shadow-sm">
            <span className="washi -top-2 left-8 rotate-2" style={{ ["--tape" as string]: "#3d5a80" }} />
            <h2 className="font-display text-2xl font-semibold">Extra photo sheets</h2>
            <p className="mt-4 font-display text-4xl font-semibold">{formatRM(PRICING.photoPrint)}</p>
            <p className="text-ink-soft">per photo, after your included sheet</p>
            <Link href="/collage" className="mt-3 inline-block text-sm font-semibold text-accent underline">Design your photo prints</Link>
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 -rotate-2" style={{ ["--tape" as string]: "#5e3c2b" }} />
          <h2 className="font-display text-2xl font-semibold">Café</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-ink-soft">
              <tr><th className="py-1.5 font-semibold">Drink</th><th className="py-1.5 text-right font-semibold">Regular</th><th className="py-1.5 text-right font-semibold">With a session</th></tr>
            </thead>
            <tbody>
              {DRINKS.map((d) => (
                <tr key={d.name} className="border-t border-dashed border-line">
                  <td className="py-2">{d.name}</td>
                  <td className="py-2 text-right">{formatRM(d.price)}</td>
                  <td className="py-2 text-right font-semibold">{formatRM(d.sessionPrice)}</td>
                </tr>
              ))}
              {PASTRIES.map((p) => (
                <tr key={p.name} className="border-t border-dashed border-line">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right">{formatRM(p.price)}</td>
                  <td className="py-2 text-right text-ink-soft">—</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-ink-soft">{SEED_COUPON}</p>
        </section>
        <section className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 rotate-3" style={{ ["--tape" as string]: "#7d9a7e" }} />
          <h2 className="font-display text-2xl font-semibold">Badges &amp; NFC</h2>
          <ul className="mt-4 divide-y divide-dashed divide-line text-sm">
            {BADGES.map((b) => (
              <li key={b.name} className="flex items-baseline justify-between gap-4 py-2">
                <span>{b.name}{b.note && <span className="block text-xs text-ink-soft">{b.note}</span>}</span>
                <span className="font-semibold">{formatRM(b.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Link href="/book" className="btn btn-primary">Book a session</Link>
      </div>
    </div>
  );
}
