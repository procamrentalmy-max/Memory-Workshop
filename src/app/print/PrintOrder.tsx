"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { CollageView } from "@/components/CollageView";
import { ShapesView } from "@/components/ShapesView";
import { PRICING, formatRM } from "@/lib/data";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { photoCount } from "@/lib/pricing";
import { notePhotos, releaseUnusedPhotos } from "../book/devicePhotos";
import { setOrder, useOrder } from "../book/orderStore";
import { sendToPrint, type PrintState } from "./actions";
import { useStudioCode } from "./studioMode";

const isPhotoPage = (kind: string) => kind === "collage" || kind === "shapes";

export function PrintOrder() {
  const order = useOrder();
  const code = useStudioCode();
  const [state, action, pending] = useActionState<PrintState, FormData>(sendToPrint, { status: "idle" });

  // Once sent, those pages leave this device's order (their photos now belong to the studio's print order).
  const sentIds = state.status === "success" ? state.sentIds.join(",") : "";
  useEffect(() => {
    if (!sentIds) return;
    const ids = sentIds.split(",");
    setOrder((o) => ({ ...o, pages: o.pages.filter((p) => !ids.includes(p.id)) }));
  }, [sentIds]);

  if (!order) return <p className="mt-6 text-ink-soft">Loading…</p>;

  if (state.status === "success") {
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 text-center shadow-sm">
        <p className="text-4xl" aria-hidden>🖨️</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Sent to print, {state.name}!</h2>
        <p className="mt-2 text-ink-soft">Our team will print your {state.photos} photo{state.photos === 1 ? "" : "s"} and bring them over.</p>
        <p className="mt-4 text-sm text-ink-soft">Your order number</p>
        <p className="font-mono text-3xl font-bold tracking-wider">{state.reference}</p>
        <p className="mt-4 text-sm">
          Sheets included in your package are free; extra sheets are {formatRM(PRICING.photoSheet)} each. Pay at the counter when
          you leave.
        </p>
        <p className="mt-2 text-xs text-ink-soft">Your photos are deleted once you&apos;ve paid.</p>
        <Link href="/collage" className="btn btn-primary mt-6">Make another photo page</Link>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <p className="font-semibold">Sending to print is for customers at the studio.</p>
        <p className="mt-1 text-ink-soft">At the studio? Scan the QR code on your table to start. Planning a visit? Add your pages and book a time.</p>
        <Link href="/book" className="btn btn-primary mt-4">Book a visit</Link>
      </div>
    );
  }

  const pages = order.pages.filter((p) => isPhotoPage(p.kind));
  const photos = pages.reduce((sum, p) => sum + photoCount(p), 0);
  const remove = (id: string) => {
    const page = pages.find((p) => p.id === id);
    setOrder((o) => ({ ...o, pages: o.pages.filter((p) => p.id !== id) }));
    if (page) {
      notePhotos(orderPhotoFiles({ visit: null, drinks: {}, pages: [page] }));
      releaseUnusedPhotos();
    }
  };

  if (pages.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-ink-soft">You haven&apos;t added any photo pages yet.</p>
        <Link href="/collage" className="btn btn-primary mt-4">Make a photo page</Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="pages" value={JSON.stringify(pages)} />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {pages.map((p) => (
          <li key={p.id} className="rounded-xl border border-line bg-card p-2">
            {p.kind === "collage" ? <CollageView collage={p.collage} /> : p.kind === "shapes" ? <ShapesView sheet={p.sheet} /> : null}
            <p className="mt-2 text-sm font-semibold">{p.kind === "collage" ? "Photo collage" : "Photo shapes"}</p>
            <p className="text-xs text-ink-soft">{photoCount(p)} photo{photoCount(p) === 1 ? "" : "s"}</p>
            <div className="mt-1 flex gap-3 text-xs font-semibold">
              <Link href={p.kind === "collage" ? `/collage?edit=${p.id}` : `/collage?mode=shapes&edit=${p.id}`} className="hover:underline">Edit</Link>
              <button type="button" onClick={() => remove(p.id)} className="text-accent hover:underline">Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/collage" className="inline-block text-sm font-semibold text-accent underline">＋ Make another photo page</Link>

      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Your name
            <input name="name" required maxLength={60} autoComplete="given-name"
              aria-invalid={state.status === "error" && state.field === "name"}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-semibold">
            Table number <span className="font-normal text-ink-soft">(optional)</span>
            <input name="table" maxLength={20} inputMode="text" className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-normal" />
          </label>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-ink-soft">
            Sheets in your package (Memory Maker 1, Complete Memory 2) are included. Extra sheets {formatRM(PRICING.photoSheet)} each, paid at the counter.
          </span>
          <span className="shrink-0 font-display text-2xl font-semibold">{pages.length} sheet{pages.length === 1 ? "" : "s"} · {photos} photo{photos === 1 ? "" : "s"}</span>
        </div>
        {state.status === "error" && <p className="mt-3 text-sm font-semibold text-accent" role="alert">{state.message}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary mt-4 w-full disabled:opacity-60">
          {pending ? "Sending…" : "Send to print"}
        </button>
      </div>
    </form>
  );
}
