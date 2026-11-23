"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { SESSION_HOURS, STUDIO, formatRM, to12h } from "@/lib/data";
import { OrderSummary } from "../OrderSummary";
import { resetOrder, useOrder } from "../orderStore";
import { placeBooking, type CheckoutState } from "./actions";

export function CheckoutForm() {
  const order = useOrder();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(placeBooking, { status: "idle" });

  useEffect(() => {
    if (state.status === "success") resetOrder();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="cut-line mx-auto max-w-xl rounded-2xl bg-card p-8 text-center">
        <p className="font-hand text-4xl text-accent">Excited to see you!</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Booking received</h1>
        <p className="mt-3 text-ink-soft">
          Thanks, {state.name}. Your reference is <strong className="text-ink">{state.reference}</strong>.
          Please keep it handy and show it when you arrive.
        </p>
        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-left text-sm">
          <dt className="text-ink-soft">When</dt>
          <dd className="font-semibold">
            {new Date(`${state.date}T00:00:00`).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}, arriving {to12h(state.time)}
          </dd>
          <dt className="text-ink-soft">Guests</dt>
          <dd className="font-semibold">{state.people}</dd>
          <dt className="text-ink-soft">Estimated total</dt>
          <dd className="font-semibold">{formatRM(state.total)} · {state.payment}</dd>
        </dl>
        <a href={calendarFile(state)} download={`${STUDIO.name} ${state.reference}.ics`} className="btn btn-primary mt-8">
          Add to my calendar
        </a>
        <br />
        <Link href="/" className="btn btn-ghost mt-3">Back to home</Link>
      </div>
    );
  }

  if (!order) return <p className="text-ink-soft">Loading…</p>;
  if (!order.visit) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">First, choose when to come in</h1>
        <Link href="/book/time" className="btn btn-primary mt-6">Choose your time</Link>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2";
  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-accent">{errors[k]}</p>;

  return (
    <form action={formAction} noValidate className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="order" value={JSON.stringify(order)} />
      <div className="min-w-0">
        <p className="font-hand text-2xl text-accent">last step</p>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Your details &amp; payment</h1>

        <fieldset className="mt-8">
          <legend className="font-display text-2xl font-semibold">Your details</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">
              Name
              <input name="name" autoComplete="name" required className={field} />
              {err("name")}
            </label>
            <label className="block text-sm font-semibold">
              Email
              <input type="email" name="email" autoComplete="email" required className={field} />
              {err("email")}
            </label>
            <label className="block text-sm font-semibold">
              Phone
              <input type="tel" name="phone" autoComplete="tel" required className={field} />
              {err("phone")}
            </label>
            <label className="block text-sm font-semibold sm:col-span-2">
              Anything we should know? <span className="font-normal text-ink-soft">(optional)</span>
              <textarea name="notes" rows={3} maxLength={1000} placeholder="e.g. it's our anniversary, we'll bring our own photos" className={field} />
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-10">
          <legend className="font-display text-2xl font-semibold">Payment</legend>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-4 has-[:checked]:border-accent">
              <input type="radio" name="payment" value="studio" defaultChecked className="mt-1 accent-[var(--accent)]" />
              <span>
                <span className="block font-semibold">Pay at the studio</span>
                <span className="text-sm text-ink-soft">Cash, card or DuitNow QR when you arrive.</span>
              </span>
            </label>
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-line p-4 opacity-60">
              <input type="radio" disabled className="mt-1" aria-label="Pay online (coming soon)" />
              <span>
                <span className="block font-semibold">Pay online now <span className="ml-1 rounded-full bg-mustard/25 px-2 py-0.5 text-xs text-[#7a5a12]">Coming soon</span></span>
                <span className="text-sm text-ink-soft">FPX online banking and card payments.</span>
              </span>
            </div>
            {err("payment")}
          </div>
        </fieldset>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/book/drinks" className="btn btn-ghost">← Back</Link>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary order={order}>
          {state.status === "error" && <p className="mt-4 text-sm text-accent" role="alert">{state.message}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full disabled:opacity-60">
            {pending ? "Booking…" : "Confirm booking"}
          </button>
        </OrderSummary>
      </aside>
    </form>
  );
}

/** A small .ics calendar file for the visit (local time, 1.5 hr). */
function calendarFile(b: { reference: string; date: string; time: string; people: number }) {
  const start = new Date(`${b.date}T${b.time}:00`);
  const end = new Date(start.getTime() + SESSION_HOURS * 3600_000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Paper and Moments//Booking//EN", "BEGIN:VEVENT",
    `UID:${b.reference}@paperandmoments`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${STUDIO.name} session (${b.people} ${b.people === 1 ? "person" : "people"})`,
    `LOCATION:${STUDIO.address}`, `DESCRIPTION:Booking reference ${b.reference}. Bring your photos!`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
