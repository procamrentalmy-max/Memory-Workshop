"use client";

import Link from "next/link";
import { CollageView } from "@/components/CollageView";
import { ShapesView } from "@/components/ShapesView";
import { EXTRA_TIME_RULE, FREE_PERKS, PACKAGES, PRICING, formatRM } from "@/lib/data";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { includedSheets, packagesTotal, peopleCount, photoCount } from "@/lib/pricing";
import { ActionBar, nextBtn } from "./ActionBar";
import { OrderSummary } from "./OrderSummary";
import { notePhotos, releaseUnusedPhotos } from "./devicePhotos";
import { setOrder, useOrder } from "./orderStore";

/** Step 1: a package for each person, and (optionally) the photo prints included in them. */
export function PackagesStep() {
  const order = useOrder();
  if (!order) return <p className="text-ink-soft">Loading…</p>;

  const qty = (id: string) => order.packages?.[id] ?? 0;
  const people = peopleCount(order);
  const change = (id: string, delta: number) =>
    setOrder((o) => {
      const packages = { ...(o.packages ?? {}) };
      const addOn = PACKAGES.find((p) => p.id === id)?.addOn;
      const full = !addOn && peopleCount({ packages }) >= 12; // up to 12 people
      const n = Math.max(0, Math.min(12, (packages[id] ?? 0) + (delta > 0 && full ? 0 : delta)));
      if (n) packages[id] = n;
      else delete packages[id];
      return { ...o, packages };
    });
  const remove = (id: string) => {
    const page = order.pages.find((p) => p.id === id);
    setOrder((o) => ({ ...o, pages: o.pages.filter((p) => p.id !== id) }));
    if (page) {
      notePhotos(orderPhotoFiles({ visit: null, drinks: {}, pages: [page] }));
      releaseUnusedPhotos();
    }
  };
  const included = includedSheets(order);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <p className="font-hand text-2xl text-accent">step one</p>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Choose your packages</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">One package per person. {FREE_PERKS} {EXTRA_TIME_RULE}</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PACKAGES.filter((p) => !p.addOn).map((p) => (
              <li key={p.id} className={`flex flex-col rounded-2xl border bg-card p-5 ${qty(p.id) ? "border-accent" : "border-line"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <span className="font-display text-2xl font-semibold">{formatRM(p.price)}</span>
                </div>
                <ul className="mt-2 flex-1 space-y-1 text-sm">
                  {p.includes.map((x) => (
                    <li key={x} className="flex gap-2"><span className="text-[#3f5e41]" aria-hidden>✓</span>{x}</li>
                  ))}
                </ul>
                {(p.typical || p.note) && <p className="mt-2 text-xs text-ink-soft">{p.typical ?? p.note}</p>}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-soft">{qty(p.id) ? `${qty(p.id)} ${p.addOn ? "" : qty(p.id) === 1 ? "person" : "people"}` : p.addOn ? "each" : "per person"}</span>
                  <div className="flex items-center rounded-full border border-line">
                    <button type="button" onClick={() => change(p.id, -1)} aria-label={`One less ${p.name}`} disabled={!qty(p.id)} className="h-10 w-10 text-lg disabled:opacity-30">−</button>
                    <span className="w-6 text-center font-semibold" aria-live="polite">{qty(p.id)}</span>
                    <button type="button" onClick={() => change(p.id, 1)} aria-label={`One more ${p.name}`} className="h-10 w-10 text-lg">+</button>
                  </div>
                </div>
              </li>
          ))}
        </ul>

        <h2 className="mt-10 font-display text-2xl font-semibold">Add a badge workshop</h2>
        <p className="text-sm text-ink-soft">Taken with a package above, which gives you your studio time.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {PACKAGES.filter((p) => p.addOn).map((p) => (
              <li key={p.id} className={`flex flex-col rounded-2xl border bg-card p-5 ${qty(p.id) ? "border-accent" : "border-line"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <span className="font-display text-2xl font-semibold">{formatRM(p.price)}</span>
                </div>
                <ul className="mt-2 flex-1 space-y-1 text-sm">
                  {p.includes.map((x) => (
                    <li key={x} className="flex gap-2"><span className="text-[#3f5e41]" aria-hidden>✓</span>{x}</li>
                  ))}
                </ul>
                {(p.typical || p.note) && <p className="mt-2 text-xs text-ink-soft">{p.typical ?? p.note}</p>}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-soft">{qty(p.id) ? `${qty(p.id)} ${p.addOn ? "" : qty(p.id) === 1 ? "person" : "people"}` : p.addOn ? "each" : "per person"}</span>
                  <div className="flex items-center rounded-full border border-line">
                    <button type="button" onClick={() => change(p.id, -1)} aria-label={`One less ${p.name}`} disabled={!qty(p.id)} className="h-10 w-10 text-lg disabled:opacity-30">−</button>
                    <span className="w-6 text-center font-semibold" aria-live="polite">{qty(p.id)}</span>
                    <button type="button" onClick={() => change(p.id, 1)} aria-label={`One more ${p.name}`} className="h-10 w-10 text-lg">+</button>
                  </div>
                </div>
              </li>
          ))}
        </ul>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold">Your photo prints</h2>
              <p className="text-sm text-ink-soft">
                {included
                  ? `Your packages include ${included} A4 photo sheet${included === 1 ? "" : "s"} (Memory Maker: 2 A5 prints on one sheet). Design them now, or at the studio.`
                  : "Memory Maker and Complete Memory include photo prints. You can also add photo sheets to any package."}
              </p>
            </div>
            <Link href="/collage" className="btn btn-ghost !px-5 !py-2.5">
              {order.pages.length ? "＋ Design another sheet" : "Design your photo prints"}
            </Link>
          </div>
          {order.pages.length > 0 && (
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
          <p className="mt-2 text-xs text-ink-soft">Sheets beyond those in your packages are {formatRM(PRICING.photoSheet)} each (an A4 photo print).</p>
        </section>

        <ActionBar summary={<>Packages <strong className="ml-1 font-display text-xl">{formatRM(packagesTotal(order))}</strong> <span className="block text-xs text-paper/70">{people} {people === 1 ? "person" : "people"}</span></>}>
          {people ? (
            <Link href="/book/time" className={nextBtn}><span>Next<span className="hidden sm:inline">: choose your time</span> →</span></Link>
          ) : (
            <span className={`${nextBtn} pointer-events-none opacity-50`} aria-disabled="true">Choose a package</span>
          )}
        </ActionBar>
      </div>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <OrderSummary order={order} />
      </aside>
    </div>
  );
}
