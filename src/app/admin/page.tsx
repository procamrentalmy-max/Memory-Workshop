import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { TEMPLATES, formatRM, to12h } from "@/lib/data";
import { PAGE, sizeLabel } from "@/lib/pageSize";
import { layout } from "@/lib/collage";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { PHOTO_KEEP_DAYS, getBookings, getCafeMenu, getElements, getPhotoCleanupReport } from "@/lib/store";
import { elementSrc, siteFileSrc } from "@/lib/types";
import { removeElement, saveElement } from "./actions";
import { MenuUploader } from "./MenuUploader";
import { PhotoCleanupButton } from "./PhotoCleanupButton";
import { UploadForm } from "./UploadForm";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

async function ElementList() {
  await connection();
  const elements = await getElements();
  if (elements.length === 0) {
    return <p className="mt-6 text-ink-soft">No elements yet. Upload your first one above.</p>;
  }
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {elements.map((el) => (
        <li key={el.id} className="rounded-xl border border-line bg-card p-4">
          <div className="grid h-36 place-items-center rounded-lg bg-[repeating-conic-gradient(#f2ebdf_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-2">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={elementSrc(el.file)} alt={el.name} className="block max-h-32 w-auto object-contain" />
              {el.photoWindow && (
                <span className="absolute border-2 border-dashed border-accent bg-accent/20"
                  style={{ left: `${el.photoWindow.x}%`, top: `${el.photoWindow.y}%`, width: `${el.photoWindow.w}%`, height: `${el.photoWindow.h}%` }} />
              )}
            </div>
          </div>
          {el.photoWindow && <p className="mt-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">Photo frame</p>}
          <p className="mt-2 text-xs text-ink-soft">
            Prints at <strong className="text-ink">{sizeLabel(el.widthCm, el.heightCm)}</strong> · image {el.width} × {el.height} px
          </p>
          <form action={saveElement} className="mt-2 grid grid-cols-[1fr_4.5rem_4.5rem] items-end gap-2">
            <input type="hidden" name="id" value={el.id} />
            <label className="text-xs font-semibold">
              Name
              <input name="name" defaultValue={el.name} required className="mt-1 w-full rounded-md border border-line px-2 py-1 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold">
              RM
              <input name="price" type="number" min={0} step="0.10" defaultValue={el.price} required className="mt-1 w-full rounded-md border border-line px-2 py-1 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold" title="Printed width; height follows the image's proportions">
              Width cm
              <input name="widthCm" type="number" min={0.1} max={PAGE.widthCm} step="any" defaultValue={el.widthCm} required className="mt-1 w-full rounded-md border border-line px-2 py-1 text-sm font-normal" />
            </label>
            <button className="col-span-3 rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-paper">Save changes</button>
          </form>
          <form action={removeElement} className="mt-2">
            <input type="hidden" name="id" value={el.id} />
            <button className="text-xs font-semibold text-accent hover:underline">Delete element</button>
          </form>
        </li>
      ))}
    </ul>
  );
}

async function CafeMenuStatus() {
  await connection();
  const menu = await getCafeMenu();
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm">
      <p className="text-sm">
        {menu ? (
          <>
            Current menu uploaded {new Date(menu.uploadedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
            <a href={siteFileSrc(menu.file)} target="_blank" rel="noreferrer" className="font-semibold text-accent underline">View PDF</a>
          </>
        ) : (
          <span className="text-ink-soft">No menu uploaded yet. The shop page shows the drinks list until you add one.</span>
        )}
      </p>
      <MenuUploader hasMenu={Boolean(menu)} />
    </div>
  );
}

async function PhotoCleanup() {
  await connection();
  const r = await getPhotoCleanupReport();
  const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const stat = (label: string, value: string, note?: string) => (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="font-display text-2xl font-semibold">{value}</dd>
      {note && <dd className="text-xs text-ink-soft">{note}</dd>}
    </div>
  );
  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-6 rounded-2xl bg-card p-6 shadow-sm">
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        {stat("Photos stored", String(r.total), mb(r.totalBytes))}
        {stat("Booked", String(r.booked), "kept until the session ends")}
        {stat("Drafts", String(r.drafts), `kept ${PHOTO_KEEP_DAYS} days after last use`)}
        {stat("Expired", String(r.expired.length), mb(r.expiredBytes))}
      </dl>
      <PhotoCleanupButton count={r.expired.length} bytes={r.expiredBytes} />
    </div>
  );
}

async function BookingList() {
  await connection();
  const bookings = await getBookings();
  if (bookings.length === 0) return <p className="mt-6 text-ink-soft">No bookings yet.</p>;
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-paper-2 text-ink-soft">
          <tr>
            {["Ref", "Arrival", "Guests", "Name & contact", "Pages", "Photos", "Drinks", "Payment", "Total"].map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.reference} className="border-t border-line align-top">
              <td className="px-3 py-2 font-mono text-xs">{b.reference}</td>
              <td className="px-3 py-2">{b.order.visit?.date}<br />{b.order.visit && to12h(b.order.visit.time)}</td>
              <td className="px-3 py-2">{b.order.visit?.people}</td>
              <td className="px-3 py-2">{b.name}<br /><span className="text-xs text-ink-soft">{b.email} · {b.phone}</span></td>
              <td className="px-3 py-2">
                {b.order.pages.map((p) =>
                  p.kind === "preset" ? TEMPLATES.find((t) => t.id === p.templateId)?.name
                    : p.kind === "collage" ? `Photo collage (${p.collage.orientation}, ${layout(p.collage.root).leaves.length} sections)`
                    : p.kind === "shapes" ? `Photo shapes (${p.sheet.orientation}, ${p.sheet.shapes.length} photos)`
                    : `Custom design (${p.items.length} items)`,
                ).join(", ") || "—"}
              </td>
              <td className="px-3 py-2">
                {(() => {
                  // Customer photos to print, in page order.
                  const files = orderPhotoFiles(b.order);
                  const v = b.order.visit;
                  // Malaysia is UTC+8; a session lasts about 1.5 hours.
                  const sessionOver = v && new Date(`${v.date}T${v.time}:00+08:00`).getTime() + 90 * 60_000 < Date.now();
                  if (files.length && sessionOver) return <span className="text-ink-soft">Removed after visit</span>;
                  return files.length ? (
                    <span className="flex flex-wrap gap-x-2">
                      {files.map((f, i) => (
                        <a key={f} href={`/api/photos/${f}`} target="_blank" rel="noreferrer" className="text-accent underline">Photo {i + 1}</a>
                      ))}
                    </span>
                  ) : "—";
                })()}
              </td>
              <td className="px-3 py-2">{Object.entries(b.order.drinks).map(([n, q]) => `${q}× ${n}`).join(", ") || "—"}</td>
              <td className="px-3 py-2">{b.payment}</td>
              <td className="px-3 py-2 font-semibold">{formatRM(b.totals.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">Studio admin</h1>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Upload a page element</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Elements appear in the drag &amp; drop editor at the price you set. Pages are A4
          ({PAGE.widthCm} × {PAGE.heightCm} cm). Enter each element&apos;s printed size and it is placed on the page at exactly
          that size; customers can move it but can&apos;t resize or crop it. Sections and text boxes are always free.
        </p>
        <div className="mt-4"><UploadForm /></div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Elements</h2>
        <Suspense fallback={<p className="mt-6 text-ink-soft">Loading…</p>}><ElementList /></Suspense>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Café menu (PDF)</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Shown on the Shop &amp; Café page as a &ldquo;View our café menu&rdquo; button. Uploading a new one replaces the old one. PDF, under 4.4 MB.
        </p>
        <Suspense fallback={<p className="mt-4 text-ink-soft">Loading…</p>}><CafeMenuStatus /></Suspense>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Customer photos</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Photos in a booking are kept until the session is over (arrival + 1.5 hours). Photos customers added but haven&apos;t
          booked are kept while they keep working on their pages, and deleted after {PHOTO_KEEP_DAYS} days without use.
          Expired photos are deleted automatically every hour; the button does it straight away.
        </p>
        <Suspense fallback={<p className="mt-4 text-ink-soft">Counting photos…</p>}><PhotoCleanup /></Suspense>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Bookings</h2>
        <Suspense fallback={<p className="mt-6 text-ink-soft">Loading…</p>}><BookingList /></Suspense>
      </section>
    </div>
  );
}
