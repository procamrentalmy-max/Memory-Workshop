"use client";

import { useState, useTransition } from "react";
import { markPrinted, settleBill } from "./actions";

/** Mark an order printed, and settle the bill when the customer leaves (deletes their photos). */
export function OrderActions({ reference, printed, photoCount }: { reference: string; printed: boolean; photoCount: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const settle = () => {
    const photos = photoCount ? ` Their ${photoCount} photo${photoCount === 1 ? "" : "s"} will be deleted straight away.` : "";
    if (!confirm(`Has ${reference} paid and left?${photos}`)) return;
    start(async () => {
      try {
        await settleBill(reference);
      } catch {
        setMessage("Couldn't settle this order. Please try again.");
      }
    });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => start(() => markPrinted(reference, !printed))}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${printed ? "border border-sage bg-sage/15 text-[#3f5e41]" : "border border-line bg-white hover:border-ink"}`}>
        {printed ? "✓ Printed (undo)" : "Mark as printed"}
      </button>
      <button type="button" disabled={pending} onClick={settle} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-60">
        Bill settled · delete photos
      </button>
      {message && <span className="text-xs font-semibold text-accent" role="alert">{message}</span>}
    </div>
  );
}
