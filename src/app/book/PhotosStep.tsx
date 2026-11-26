"use client";

import Link from "next/link";
import { CollageView } from "@/components/CollageView";
import { ShapesView } from "@/components/ShapesView";
import { INCLUDED_SHEETS_PER_PERSON, PRICING, SESSION_INCLUDES, formatRM } from "@/lib/data";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { photoCount } from "@/lib/pricing";
import { ActionBar, nextBtn } from "./ActionBar";
import { OrderSummary } from "./OrderSummary";
import { notePhotos, releaseUnusedPhotos } from "./devicePhotos";
import { setOrder, useOrder } from "./orderStore";

/** Step 1: the photo prints included in the session (optional; can be done at the studio). */
export function PhotosStep() {
  const order = useOrder();
  if (!order) return <p className="text-ink-soft">Loading…</p>;

  const remove = (id: string) => {
    const page = order.pages.find((p) => p.id === id);
    setOrder((o) => ({ ...o, pages: o.pages.filter((p) => p.id !== id) }));
    if (page) {
      notePhotos(orderPhotoFiles({ visit: null, drinks: {}, pages: [page] }));
      releaseUnusedPhotos();
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <p className="font-hand text-2xl text-accent">step one</p>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Your photo prints</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Every session includes <strong className="text-ink">two A5 photo prints per person</strong>: one A4 sheet you design
          yourself. Split it in two, make a grid or draw shapes, then add your photos. We&apos;ll print them for your visit.
          Prefer to do it at the studio? Skip this step.
        </p>

        <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold">Your RM24 session includes</p>
          <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
            {SESSION_INCLUDES.map((x) => (
              <li key={x} className="flex gap-2"><span className="text-[#3f5e41]" aria-hidden>✓</span>{x}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Your photo sheets</h2>
          <Link href="/collage" className="btn btn-primary !px-5 !py-2.5">
            {order.pages.length ? "＋ Design another sheet" : "Design your photo prints"}
          </Link>
        </div>
        {order.pages.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-soft">
            No photo sheets yet. Design them now, or at the studio.
          </p>
        ) : (
          <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {order.pages.map((p) => (
              <li key={p.id} className="w-36 shrink-0 rounded-xl border border-line bg-card p-2">
                {p.kind === "collage" ? <CollageView collage={p.collage} /> : <ShapesView sheet={p.sheet} />}
                <p className="mt-2 truncate text-sm font-semibold">{p.kind === "collage" ? "Photo collage" : "Photo shapes"}</p>
                <p className="text-xs text-ink-soft">{photoCount(p)} photo{photoCount(p) === 1 ? "" : "s"}</p>
                <div className="mt-1 flex gap-3 text-xs font-semibold">
                  <Link href={p.kind === "collage" ? `/collage?edit=${p.id}` : `/collage?mode=shapes&edit=${p.id}`} className="text-ink hover:underline">Edit</Link>
                  <button type="button" onClick={() => remove(p.id)} className="text-accent hover:underline">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-soft">
          {INCLUDED_SHEETS_PER_PERSON} sheet per person is included. Extra sheets are {formatRM(PRICING.photoPrint)} per photo.
        </p>

        <ActionBar summary={<>Session <strong className="ml-1 font-display text-xl">{formatRM(PRICING.session)}</strong> <span className="text-paper/70">per person</span></>}>
          <Link href="/book/time" className={nextBtn}>
            {order.pages.length ? <>Next<span className="hidden sm:inline">: choose your time</span> →</> : "Skip for now →"}
          </Link>
        </ActionBar>
      </div>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <OrderSummary order={order} />
      </aside>
    </div>
  );
}
