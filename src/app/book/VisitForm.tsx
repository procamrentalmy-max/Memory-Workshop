"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ARRIVAL_TIMES, EXTRA_TIME_RULE, STUDIO, formatRM, to12h } from "@/lib/data";
import { packagesTotal, peopleCount } from "@/lib/pricing";
import type { Order } from "@/lib/types";
import { ActionBar, nextBtn } from "./ActionBar";
import { OrderSummary } from "./OrderSummary";
import { setOrder, useOrder } from "./orderStore";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isClosed = (dateISO: string) => new Date(`${dateISO}T00:00:00`).getDay() === 1; // Mondays

/** Snapshot of "now" taken once, so renders stay pure. */
function nowInfo() {
  const d = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    return iso(x);
  });
  return { today: days[0], time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, days };
}

export function VisitForm() {
  const order = useOrder();
  if (!order) return <p className="text-ink-soft">Loading…</p>;
  return <VisitFormInner order={order} />;
}

function VisitFormInner({ order }: { order: Order }) {
  const router = useRouter();
  const [now] = useState(nowInfo);
  const initial = order.visit && order.visit.date >= now.today ? order.visit : null;
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const people = peopleCount(order); // one package per person
  const [error, setError] = useState("");

  const isPast = (t: string, d = date) => d === now.today && t <= now.time;
  const todayFull = ARRIVAL_TIMES.every((t) => isPast(t, now.today));
  const otherDate = date && !now.days.includes(date) ? date : "";

  function pickDate(d: string) {
    setError("");
    if (d && d < now.today) return setError("Please choose a date from today onwards.");
    if (d && isClosed(d)) return setError("We're closed on Mondays. Please pick another day.");
    setDate(d);
    if (time && isPast(time, d)) setTime("");
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError("Please choose a date.");
    if (!time) return setError("Please choose when you'd like to arrive.");
    if (!people) return setError("Please choose your packages first.");
    setOrder((o) => ({ ...o, visit: { date, time, people } }));
    router.push("/book/drinks");
  }

  const preview: Order = { ...order, visit: { date, time, people } };

  return (
    <form onSubmit={next} className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <p className="font-hand text-2xl text-accent">step two</p>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">When would you like to come in?</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Just pick your arrival time. Packages include 1 hour (Basic – 30 minutes: 30 minutes). {EXTRA_TIME_RULE}
        </p>

        {/* People come from the packages chosen in step one */}
        <p className="mt-6 text-sm">
          {people ? (
            <>
              <strong>{people} {people === 1 ? "person" : "people"}</strong> · <Link href="/book" className="text-accent underline">change packages</Link>
            </>
          ) : (
            <>
              No packages yet. <Link href="/book" className="font-semibold text-accent underline">Choose your packages first</Link>.
            </>
          )}
          {people >= 12 && (
            <span className="block text-xs text-ink-soft">
              Bigger group? Email <a className="underline" href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a> and we&apos;ll set it up.
            </span>
          )}
        </p>

        {/* Date */}
        <fieldset className="mt-8 min-w-0">
          <legend className="text-sm font-semibold">Which day?</legend>
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {now.days.map((d, i) => {
              const dt = new Date(`${d}T00:00:00`);
              const closed = isClosed(d) || (i === 0 && todayFull);
              const active = date === d;
              return (
                <button key={d} type="button" disabled={closed} onClick={() => pickDate(d)} aria-pressed={active}
                  className={`flex w-[72px] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition-colors ${
                    active ? "border-ink bg-ink text-paper" : closed ? "border-dashed border-line text-ink-soft/60" : "border-line bg-card hover:border-ink"
                  }`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    {i === 0 ? "Today" : i === 1 ? "Tmrw" : dt.toLocaleDateString("en-MY", { weekday: "short" })}
                  </span>
                  <span className="font-display text-xl font-semibold leading-tight">{dt.getDate()}</span>
                  <span className="text-[11px]">{closed ? (isClosed(d) ? "Closed" : "Full") : dt.toLocaleDateString("en-MY", { month: "short" })}</span>
                </button>
              );
            })}
          </div>
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            Later date:
            <input type="date" min={now.today} value={otherDate} onChange={(e) => pickDate(e.target.value)}
              className={`rounded-lg border bg-card px-3 py-1.5 text-ink ${otherDate ? "border-ink" : "border-line"}`} />
          </label>
        </fieldset>

        {/* Time */}
        <fieldset className="mt-8 min-w-0" disabled={!date}>
          <legend className="text-sm font-semibold">Arrival time</legend>
          {!date && <p className="mt-1 text-xs text-ink-soft">Choose a day first.</p>}
          <div className={`mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 ${!date ? "opacity-40" : ""}`}>
            {ARRIVAL_TIMES.map((t) => {
              const past = isPast(t);
              return (
                <button key={t} type="button" disabled={past} onClick={() => { setTime(t); setError(""); }} aria-pressed={time === t}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                    time === t ? "border-ink bg-ink text-paper" : past ? "border-line text-ink-soft/40 line-through" : "border-line bg-card hover:border-ink"
                  }`}>
                  {to12h(t)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Open Tuesday to Sunday, 10 am – 10 pm. Last arrival 9 pm.</p>
        </fieldset>

        {error && <p className="mt-4 text-sm font-semibold text-accent" role="alert">{error}</p>}

        <ActionBar back="/book" summary={<>Packages <strong className="ml-1 font-display text-xl">{formatRM(packagesTotal(order))}</strong><span className="block text-xs text-paper/70">{people} {people === 1 ? "person" : "people"}</span></>}>
          <button type="submit" className={nextBtn}>
            <span>Next<span className="hidden sm:inline">: choose a drink</span> →</span>
          </button>
        </ActionBar>
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <OrderSummary order={preview} />
      </aside>
    </form>
  );
}
