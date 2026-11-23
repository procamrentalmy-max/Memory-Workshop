"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { A4_ASPECT, PAGE, elementBox, fitsOnPage, heightForWidth, printDpi, sizeLabel } from "@/lib/pageSize";
import type { Rect } from "@/lib/types";
import { FrameWindowPicker } from "./FrameWindowPicker";

const MAX_BYTES = 4.4 * 1024 * 1024; // the live site (Vercel) refuses uploads above 4.5 MB
const DEFAULT_WINDOW: Rect = { x: 10, y: 10, w: 80, h: 80 };

function readSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number } | null>(null);
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isFrame, setIsFrame] = useState(false);
  const [photoWindow, setPhotoWindow] = useState<Rect>(DEFAULT_WINDOW);

  async function onFile(file: File | undefined) {
    setError("");
    if (preview) URL.revokeObjectURL(preview.url);
    setWidthCm("");
    setHeightCm("");
    setPhotoWindow(DEFAULT_WINDOW);
    if (!file) return setPreview(null);
    if (file.size > MAX_BYTES) {
      setPreview(null);
      return setError("That image is over 4.4 MB. Please use a smaller file (a PNG or JPG under 4 MB).");
    }
    try {
      const size = await readSize(file);
      setPreview({ url: URL.createObjectURL(file), ...size });
    } catch (e) {
      setPreview(null);
      setError((e as Error).message);
    }
  }

  // Width and height are linked through the image's proportions, so it's never stretched or cropped.
  function changeWidth(v: string) {
    setWidthCm(v);
    const w = Number(v);
    setHeightCm(preview && w > 0 ? String(heightForWidth(w, preview)) : "");
  }
  function changeHeight(v: string) {
    setHeightCm(v);
    const h = Number(v);
    setWidthCm(preview && h > 0 ? String(round2((h * preview.width) / preview.height)) : "");
  }

  const w = Number(widthCm);
  const h = Number(heightCm);
  const hasSize = w > 0 && h > 0;
  const fits = hasSize && fitsOnPage(w, h);
  const dpi = preview && w > 0 ? printDpi(preview.width, w) : 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!preview) return setError("Please choose an image.");
    if (!hasSize) return setError("Please enter the printed size in cm.");
    if (!fits) return setError(`That's bigger than the A4 page (${sizeLabel(PAGE.widthCm, PAGE.heightCm)}).`);
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    data.set("width", String(preview.width));
    data.set("height", String(preview.height));
    data.set("widthCm", String(w));
    if (isFrame) data.set("photoWindow", JSON.stringify(photoWindow));
    const res = await fetch("/api/admin/elements", { method: "POST", body: data });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Upload failed.");
      return;
    }
    formRef.current?.reset();
    URL.revokeObjectURL(preview.url);
    setPreview(null);
    setWidthCm("");
    setHeightCm("");
    setIsFrame(false);
    router.refresh();
  }

  const field = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2";
  const box = hasSize ? elementBox(w, h) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-6 rounded-2xl bg-card p-6 shadow-sm md:grid-cols-[1fr_auto]">
      <div className="space-y-4">
        <label className="block text-sm font-semibold">
          Image (PNG with transparency works best for stickers)
          <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required
            onChange={(e) => onFile(e.target.files?.[0])} className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-paper-2 file:px-3 file:py-1`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Name
            <input name="name" required maxLength={80} placeholder="e.g. Vintage airmail stamp" className={field} />
          </label>
          <label className="block text-sm font-semibold">
            Price (RM)
            <input name="price" type="number" min={0} step="0.10" required placeholder="2.00" className={field} />
          </label>
        </div>

        <fieldset disabled={!preview}>
          <legend className="text-sm font-semibold">Printed size on the A4 page</legend>
          <div className="mt-1 flex items-end gap-2">
            <label className="block flex-1 text-xs font-semibold text-ink-soft">
              Width (cm)
              <input type="number" min={0.1} max={PAGE.widthCm} step="any" value={widthCm} onChange={(e) => changeWidth(e.target.value)}
                placeholder="e.g. 5" className={`${field} text-sm text-ink disabled:bg-paper-2`} />
            </label>
            <span className="pb-2.5 text-ink-soft">×</span>
            <label className="block flex-1 text-xs font-semibold text-ink-soft">
              Height (cm)
              <input type="number" min={0.1} max={PAGE.heightCm} step="any" value={heightCm} onChange={(e) => changeHeight(e.target.value)}
                placeholder="auto" className={`${field} text-sm text-ink disabled:bg-paper-2`} />
            </label>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {preview
              ? "Type either one; the other follows the image's proportions so it's never stretched or cropped."
              : "Choose an image first."}
          </p>
          {hasSize && !fits && (
            <p className="mt-1 text-xs font-semibold text-accent">Too big for A4 ({sizeLabel(PAGE.widthCm, PAGE.heightCm)}).</p>
          )}
          {fits && dpi > 0 && dpi < 150 && (
            <p className="mt-1 text-xs font-semibold text-[#7a5a12]">
              This image is only {dpi} dpi at that size, so it may look blurry when printed. A larger image file would print sharper.
            </p>
          )}
        </fieldset>

        <fieldset disabled={!preview} className="rounded-xl border border-line p-3">
          <label className="flex items-start gap-2 text-sm font-semibold">
            <input type="checkbox" checked={isFrame} onChange={(e) => setIsFrame(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
            <span>
              This is a photo frame
              <span className="block text-xs font-normal text-ink-soft">Customers can put their own photo in it, then move and zoom it.</span>
            </span>
          </label>
          {isFrame && preview && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-ink-soft">Drag on the image to mark where the customer&apos;s photo goes (the shaded box).</p>
              <FrameWindowPicker src={preview.url} value={photoWindow} onChange={setPhotoWindow} />
            </div>
          )}
        </fieldset>

        {error && <p className="text-sm text-accent" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-60">
          {busy ? "Uploading…" : "Upload element"}
        </button>
      </div>

      {/* Preview: the element to scale on an A4 page */}
      <div className="flex flex-col items-center gap-2">
        <div className={`relative w-44 ${A4_ASPECT} overflow-hidden rounded-sm border border-line bg-white shadow-sm`}>
          {preview && box && fits ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="Preview at size" className="absolute object-contain"
              style={{ width: `${box.w}%`, height: `${box.h}%`, left: `${(100 - box.w) / 2}%`, top: `${(100 - box.h) / 2}%` }} />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="Preview" className="absolute inset-3 m-auto max-h-[80%] max-w-[80%] object-contain opacity-40" />
          ) : (
            <p className="absolute inset-0 grid place-items-center p-3 text-center text-xs text-ink-soft">A4 preview</p>
          )}
        </div>
        <p className="text-center text-xs text-ink-soft">
          {fits ? <>Prints at <strong className="text-ink">{sizeLabel(w, h)}</strong></> : "A4 page, 21 × 29.7 cm"}
        </p>
      </div>
    </form>
  );
}
