import type { Metadata } from "next";
import Link from "next/link";
import { PRICING, SESSION_HOURS, formatRM } from "@/lib/data";
import { sessionEstimate } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, affordable pricing: a per-person hourly studio fee plus the pages you choose.",
};

const EXAMPLES = [
  { label: "Solo afternoon", people: 1, pages: 2 },
  { label: "Date night", people: 2, pages: 3 },
  { label: "Friends' get-together", people: 4, pages: 5 },
  { label: "Family day", people: 5, pages: 6 },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">simple &amp; affordable</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Pricing</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">Your time in the studio, plus the pages you choose to make.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#c4553a" }} />
          <h2 className="font-display text-2xl font-semibold">Studio session</h2>
          <p className="mt-4 font-display text-5xl font-semibold">{formatRM(PRICING.sessionPerPersonPerHour)}</p>
          <p className="text-ink-soft">per person, per hour</p>
          <p className="mt-4 text-sm">Most visits take about {SESSION_HOURS} hours ({formatRM(sessionEstimate(1))} per person). Tools, table, help from our team and <strong>free stickers &amp; stationery</strong> included.</p>
        </div>
        <div className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 rotate-3" style={{ ["--tape" as string]: "#e0a93b" }} />
          <h2 className="font-display text-2xl font-semibold">Ready-made page</h2>
          <p className="mt-4 font-display text-5xl font-semibold">{formatRM(PRICING.perPage)}</p>
          <p className="text-ink-soft">per page</p>
          <p className="mt-4 text-sm">All printed materials, your photos and instructions included.</p>
        </div>
        <div className="relative rounded-2xl bg-card p-8 shadow-sm">
          <span className="washi -top-2 left-8 -rotate-2" style={{ ["--tape" as string]: "#7d9a7e" }} />
          <h2 className="font-display text-2xl font-semibold">Design your own</h2>
          <p className="mt-4 font-display text-5xl font-semibold">Pay per element</p>
          <p className="mt-4 text-sm">Each element shows its own price. Coloured sections and text boxes are free.</p>
        </div>
      </div>

      <h2 className="mt-16 font-display text-2xl font-semibold">Example visits (ready-made pages)</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-paper-2 text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Visit</th>
              <th className="px-4 py-3 font-semibold">People</th>
              <th className="px-4 py-3 font-semibold">Pages</th>
              <th className="px-4 py-3 text-right font-semibold">Estimated total</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((e) => (
              <tr key={e.label} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">{e.label}</td>
                <td className="px-4 py-3">{e.people}</td>
                <td className="px-4 py-3">{e.pages}</td>
                <td className="px-4 py-3 text-right font-display text-lg font-semibold">
                  {formatRM(sessionEstimate(e.people) + e.pages * PRICING.perPage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-soft">Based on a {SESSION_HOURS} hour visit. Stickers and stationery are free; drinks, notebooks and albums are extra.</p>

      <div className="mt-12 text-center">
        <Link href="/book" className="btn btn-primary">Book a session</Link>
      </div>
    </div>
  );
}
