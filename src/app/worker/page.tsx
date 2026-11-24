import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CollageView } from "@/components/CollageView";
import { ShapesView } from "@/components/ShapesView";
import { TEMPLATES, to12h } from "@/lib/data";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { dpiQuality, photoDpi, printSheet } from "@/lib/printing";
import { getWorkerOrders, type Booking } from "@/lib/store";
import type { OrderPage } from "@/lib/types";
import { AutoRefresh } from "./AutoRefresh";
import { OrderActions } from "./OrderActions";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Worker · Print orders", robots: { index: false } };

const KL = "Asia/Kuala_Lumpur";
const klDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: KL }).format(d); // YYYY-MM-DD
const klTime = (iso: string) => new Intl.DateTimeFormat("en-MY", { timeZone: KL, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const dayLabel = (date: string, today: string) =>
  date === today ? "Today" : new Date(`${date}T00:00:00Z`).toLocaleDateString("en-MY", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });

const isPhotoPage = (p: OrderPage) => p.kind === "collage" || p.kind === "shapes";

export default function WorkerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <p className="font-hand text-2xl text-accent">studio staff</p>
      <h1 className="font-display text-4xl font-semibold">Print orders</h1>
      <p className="mt-2 max-w-3xl text-ink-soft">
        Orders appear here as soon as customers check out. Download each photo page&apos;s print file and print it at
        actual size on A4. When the customer has paid and leaves, press <strong className="text-ink">Bill settled</strong>:
        their photos are deleted straight away.
      </p>
      <Suspense fallback={<p className="mt-8 text-ink-soft">Loading orders…</p>}>
        <Orders />
      </Suspense>
    </div>
  );
}

async function Orders() {
  await connection();
  const { open, settled } = await getWorkerOrders();
  const today = klDate(new Date());
  const groups = [
    { title: "Today", orders: open.filter((b) => b.order.visit?.date === today) },
    { title: "Earlier, bill not settled yet", orders: open.filter((b) => (b.order.visit?.date ?? "") < today) },
    { title: "Coming up", orders: open.filter((b) => (b.order.visit?.date ?? "") > today) },
  ];
  return (
    <>
      <AutoRefresh />
      <p className="mt-2 text-xs text-ink-soft">Updated {klTime(new Date().toISOString())} · refreshes by itself every 30 seconds</p>
      {open.length === 0 && <p className="mt-8 rounded-xl bg-card p-6 text-ink-soft">No open orders right now.</p>}
      {groups.map((g) =>
        g.orders.length ? (
          <section key={g.title} className="mt-10">
            <h2 className="font-display text-2xl font-semibold">{g.title} <span className="text-base font-normal text-ink-soft">· {g.orders.length}</span></h2>
            <ul className="mt-4 space-y-4">
              {g.orders.map((b) => <OrderCard key={b.reference} booking={b} today={today} />)}
            </ul>
          </section>
        ) : null,
      )}
      {settled.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Recently settled</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card text-sm">
            {settled.map((b) => (
              <li key={b.reference} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span><span className="font-mono text-xs">{b.reference}</span> · {b.name}</span>
                <span className="text-ink-soft">Settled {dayLabel(klDate(new Date(b.settledAt!)), today)}, {klTime(b.settledAt!)} · photos deleted</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function OrderCard({ booking: b, today }: { booking: Booking; today: string }) {
  const v = b.order.visit;
  const photoPages = b.order.pages.filter(isPhotoPage);
  const allFiles = orderPhotoFiles(b.order);
  // Photos in ready-made / drag & drop pages: printed separately at their frame size.
  const otherFiles = orderPhotoFiles({ ...b.order, pages: b.order.pages.filter((p) => !isPhotoPage(p)) });
  const otherPages = b.order.pages.filter((p) => !isPhotoPage(p));
  return (
    <li className={`rounded-2xl border bg-card p-4 shadow-sm sm:p-5 ${b.printedAt ? "border-line" : "border-mustard"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">
            {b.name} <span className="ml-1 font-mono text-xs font-normal text-ink-soft">{b.reference}</span>
          </p>
          <p className="text-sm text-ink-soft">
            {v ? `${dayLabel(v.date, today)}, arriving ${to12h(v.time)} · ${v.people} ${v.people === 1 ? "person" : "people"}` : ""} · {b.phone}
          </p>
          {b.notes && <p className="mt-1 text-sm">“{b.notes}”</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${b.printedAt ? "bg-sage/20 text-[#3f5e41]" : "bg-mustard/25 text-ink"}`}>
          {b.printedAt ? `Printed ${klTime(b.printedAt)}` : photoPages.length || otherFiles.length ? "To print" : "No photos"}
        </span>
      </div>

      {photoPages.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Photo pages · A4, print at actual size</h3>
            {photoPages.length > 1 && (
              <PrintButton pages={photoPages} fileName={`${b.reference}-all-photo-pages.pdf`} label={`Download all ${photoPages.length} (1 PDF)`} primary />
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-4">
            {photoPages.map((p, i) => {
              const sheet = printSheet(p)!;
              const dpis = sheet.regions.flatMap((r) => (r.photo ? [photoDpi(r.photo, r.w, r.h)] : []));
              const low = dpis.length ? Math.min(...dpis) : null;
              return (
                <li key={p.id} className="flex w-48 flex-col gap-2 rounded-xl bg-paper-2 p-3">
                  <div className={sheet.orientation === "portrait" ? "mx-auto w-28" : "w-full"}>
                    {p.kind === "collage" ? <CollageView collage={p.collage} /> : p.kind === "shapes" ? <ShapesView sheet={p.sheet} /> : null}
                  </div>
                  <p className="text-xs">
                    <strong>{p.kind === "collage" ? "Photo collage" : "Photo shapes"}</strong> · {sheet.orientation} · {dpis.length} photo{dpis.length === 1 ? "" : "s"}
                  </p>
                  {low !== null && (
                    <p className={`text-xs font-semibold ${dpiQuality(low) === "Low" ? "text-accent" : "text-[#3f5e41]"}`}>
                      {dpiQuality(low)} · lowest {low} dpi
                    </p>
                  )}
                  <PrintButton pages={[p]} fileName={`${b.reference}-page-${i + 1}.pdf`} label="Download PDF" primary={photoPages.length === 1} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {otherFiles.length > 0 && (
        <div className="mt-4 text-sm">
          <h3 className="font-semibold">Photos for other pages</h3>
          <p className="text-xs text-ink-soft">
            {otherPages.map((p) => (p.kind === "preset" ? TEMPLATES.find((t) => t.id === p.templateId)?.name : "Own design")).join(", ")} · original files
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3">
            {otherFiles.map((f, i) => (
              <a key={f} href={`/api/photos/${f}`} target="_blank" rel="noreferrer" className="text-accent underline">Photo {i + 1}</a>
            ))}
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <OrderActions reference={b.reference} printed={!!b.printedAt} photoCount={new Set(allFiles).size} />
      </div>
    </li>
  );
}
