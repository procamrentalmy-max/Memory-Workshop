import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import QRCode from "qrcode";
import { Suspense } from "react";
import { TEMPLATES, formatRM, to12h } from "@/lib/data";
import { PAGE, sizeLabel } from "@/lib/pageSize";
import { layout } from "@/lib/collage";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { PHOTO_KEEP_DAYS, getBookings, getCafeMenu, getElements, getPhotoCleanupReport, getStudioCode } from "@/lib/store";
import { elementSrc, siteFileSrc } from "@/lib/types";
import { listTags, tagStats } from "@/lib/tags";
import { tagStorage } from "@/lib/tagStorage";
import { changeStudioCode, createTagBatch, removeElement, removeTagVideo, saveElement, toggleTag } from "./actions";
import { CopyButton } from "./CopyButton";
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
        {stat("In orders", String(r.booked), "kept until the bill is settled")}
        {stat("Drafts", String(r.drafts), `kept ${PHOTO_KEEP_DAYS} days after last use`)}
        {stat("Expired", String(r.expired.length), mb(r.expiredBytes))}
      </dl>
      <PhotoCleanupButton count={r.expired.length} bytes={r.expiredBytes} />
    </div>
  );
}

/** The QR code for the studio's tables: opens the photo pages in "at the studio" mode. */
async function StudioQr() {
  await connection();
  const code = await getStudioCode();
  const url = `${await siteBase()}/collage?studio=${code}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#2a2420", light: "#ffffff" } });
  return (
    <div className="mt-4 flex flex-wrap items-start gap-6 rounded-xl border border-line bg-card p-4">
      <div className="w-44 shrink-0 [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label="QR code for the studio's tables" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Scan to make a photo page</p>
        <p className="mt-1 break-all font-mono text-xs text-ink-soft">{url}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a download="studio-qr-code.svg" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} className="btn btn-primary !px-4 !py-2 text-sm">
            Download QR code
          </a>
          <form action={changeStudioCode}>
            <button className="text-xs font-semibold text-accent hover:underline">Change code (old QR codes stop working)</button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Our public web address, for links printed on QR codes and written into NFC tags. */
async function siteBase() {
  const h = await headers();
  return (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/$/, "");
}

const R2_FREE_BYTES = 10 * 1024 ** 3;

async function NfcTags() {
  await connection();
  const [tags, stats, base] = await Promise.all([listTags(200), tagStats(), siteBase()]);
  const storage = tagStorage();
  const avg = stats.videos ? stats.bytes / stats.videos : 3 * 1024 ** 2;
  const fitMore = Math.max(0, Math.floor((R2_FREE_BYTES - stats.bytes) / avg));
  const batches = [...new Set(tags.map((t) => t.batch).filter((b): b is string => !!b))];
  return (
    <div className="mt-4 space-y-5">
      {!storage ? (
        <p className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
          <strong>Video storage isn&apos;t connected yet.</strong> Buyers can&apos;t add videos until the Cloudflare R2 keys are added
          in Vercel (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL). See the README.
        </p>
      ) : (
        <p className="text-xs text-ink-soft">Videos are stored in {storage.name}.</p>
      )}
      {base.includes("vercel.app") && (
        <p className="rounded-xl bg-mustard/15 p-4 text-sm">
          These links use <strong>{base}</strong>. Connect your own domain (and set NEXT_PUBLIC_SITE_URL) before writing tags
          you sell, so they keep working if the website ever moves.
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Tags made", String(stats.tags)],
          ["With a video", String(stats.videos)],
          ["Video storage", `${(stats.bytes / 1024 ** 2).toFixed(1)} MB`],
          ["Views", String(stats.views)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-card p-3"><dt className="text-xs text-ink-soft">{k}</dt><dd className="font-display text-2xl font-semibold">{v}</dd></div>
        ))}
      </dl>
      <p className="text-xs text-ink-soft">
        About {fitMore.toLocaleString()} more videos fit in R2&apos;s free 10 GB at {(avg / 1024 ** 2).toFixed(1)} MB each. Views are free on R2.
      </p>

      <form action={createTagBatch} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-card p-4">
        <label className="text-sm font-semibold">
          Make new tags
          <input name="count" type="number" min={1} max={200} defaultValue={10} required className="mt-1 block w-24 rounded-md border border-line px-2 py-1.5 font-normal" />
        </label>
        <button className="btn btn-primary !px-4 !py-2 text-sm">Create</button>
        <p className="w-full text-xs text-ink-soft">
          Each tag gets its own link (write it onto the NFC tag) and a setup code (print it on the card that goes with the tag).
        </p>
      </form>

      {tags.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">Download links &amp; codes (CSV):</span>
            <a href="/api/admin/tags" className="text-accent underline">all tags</a>
            {batches.slice(0, 5).map((b) => (
              <a key={b} href={`/api/admin/tags?batch=${encodeURIComponent(b)}`} className="text-accent underline">batch {b}</a>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-paper-2 text-ink-soft">
                <tr>{["Link (write onto the tag)", "Setup code", "Video", "Views", ""].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {tags.map((t) => (
                  <tr key={t.id} className={`border-t border-line align-top ${t.disabled ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2">
                      <a href={`/v/${t.id}`} target="_blank" rel="noreferrer" className="font-mono text-xs underline">{base}/v/{t.id}</a>
                      <span className="ml-2"><CopyButton text={`${base}/v/${t.id}`} /></span>
                      <span className="block text-[11px] text-ink-soft">batch {t.batch ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">{t.setupCode}</td>
                    <td className="px-3 py-2 text-xs">
                      {t.videoFile
                        ? `Added ${new Date(t.videoUpdatedAt!).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" })} · ${((t.videoBytes ?? 0) / 1024 ** 2).toFixed(1)} MB · ${t.videoSeconds ?? "?"} s`
                        : <span className="text-ink-soft">Not set up yet</span>}
                    </td>
                    <td className="px-3 py-2">{t.views}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-3 text-xs font-semibold">
                        {t.videoFile && (
                          <form action={removeTagVideo}><input type="hidden" name="id" value={t.id} /><button className="text-accent hover:underline">Remove video</button></form>
                        )}
                        <form action={toggleTag}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="disabled" value={t.disabled ? "0" : "1"} />
                          <button className="text-ink-soft hover:underline">{t.disabled ? "Turn on" : "Turn off"}</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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
              <td className="px-3 py-2 font-mono text-xs">
                {b.reference}
                <span className="mt-1 block font-sans text-[11px] text-ink-soft">{b.settledAt ? "Settled" : b.printedAt ? "Printed" : "Open"}</span>
              </td>
              <td className="px-3 py-2">
                {b.walkIn && <span className="block text-xs font-bold text-accent">In store{b.tableLabel ? ` · Table ${b.tableLabel}` : ""}</span>}
                {b.visitDate}<br />{b.arrivalTime && to12h(b.arrivalTime)}
              </td>
              <td className="px-3 py-2">{b.walkIn ? "—" : b.order.visit?.people}</td>
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
                  if (files.length && b.settledAt) return <span className="text-ink-soft">Deleted (bill settled)</span>;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-semibold">Studio admin</h1>
        <a href="/worker" className="btn btn-primary !px-4 !py-2 text-sm">Open the worker page (print orders) →</a>
      </div>

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
        <h2 className="font-display text-2xl font-semibold">In-store QR code</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Print this for your tables. Customers who scan it make photo pages on their phone and press
          <strong> Send to print</strong>: no booking, they pay at the counter. Their order appears on the worker page
          straight away. Only this code can send print orders, so random visitors online can&apos;t.
        </p>
        <Suspense fallback={<p className="mt-4 text-ink-soft">Loading…</p>}><StudioQr /></Suspense>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">NFC video tags</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Customers buy a tag, open its link (by tapping it, or typing the link) and add a 10-second video with the setup code
          from their card. After that, tapping the tag plays the video. Videos are kept for good and stored in Cloudflare R2,
          not Supabase.
        </p>
        <Suspense fallback={<p className="mt-4 text-ink-soft">Loading…</p>}><NfcTags /></Suspense>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Customer photos</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Photos in an order are kept for printing until the bill is settled on the worker page, then deleted straight away
          (if nobody settles it, they go at the end of the day after the visit). Photos customers replace or discard are
          deleted at once; unfinished pages left in a browser are deleted after {PHOTO_KEEP_DAYS} days without use.
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
