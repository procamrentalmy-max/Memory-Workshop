"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoImg, clampFill } from "@/components/PhotoImg";
import { dpiQuality, photoDpi } from "@/lib/printing";
import { clipPath, svgPoints, type Pt } from "@/lib/shapes";
import type { PhotoFill } from "@/lib/types";
import { releasePhotos, uploadPhoto } from "./photos";

/**
 * Dialog for one photo frame: upload a photo from the gallery, then drag it to move it
 * inside the frame and zoom (slider, mouse wheel or pinch) to crop it.
 * Render it only while open (a fresh one per frame), e.g. {target && <PhotoEditor … />}.
 */
export function PhotoEditor({ aspect, fill, label = "Photo frame", mask, printMm, onClose, onSave }: {
  aspect: number; // frame width ÷ height
  fill?: PhotoFill;
  mask?: Pt[]; // shaped frames: the outline (in % of the frame); the photo outside it is shown faded
  printMm?: { w: number; h: number }; // printed size of the frame, to show how sharp the photo will print
  label?: string;
  onClose: () => void;
  onSave: (fill: PhotoFill | null) => void;
}) {
  const [draft, setDraft] = useState<PhotoFill | undefined>(fill);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Photos uploaded in this window. Any that aren't kept (cancelled, or changed again) are deleted at once.
  const uploads = useRef<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: "pan"; sx: number; sy: number; x0: number; y0: number; ox: number; oy: number }
    | { kind: "pinch"; d0: number; z0: number }
    | null
  >(null);

  // Close on Escape; stop the page behind from scrolling.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      releasePhotos(uploads.current);
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function choose(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await uploadPhoto(file);
      uploads.current.push(uploaded.file);
      setDraft(uploaded);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const close = () => {
    releasePhotos(uploads.current);
    onClose();
  };
  const save = (result: PhotoFill | null) => {
    releasePhotos(uploads.current.filter((f) => f !== result?.file));
    onSave(result);
  };

  /** How far (px) the photo extends past the frame, for turning finger movement into position. */
  function overflow(f: PhotoFill) {
    const r = boxRef.current!.getBoundingClientRect();
    const ratio = f.w / f.h;
    const pw = Math.max(r.width, r.height * ratio) * f.zoom;
    return { ox: pw - r.width, oy: pw / ratio - r.height };
  }
  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  function onPointerDown(e: React.PointerEvent) {
    if (!draft) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      gesture.current = { kind: "pinch", d0: dist(), z0: draft.zoom };
    } else {
      const { ox, oy } = overflow(draft);
      gesture.current = { kind: "pan", sx: e.clientX, sy: e.clientY, x0: draft.x, y0: draft.y, ox, oy };
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draft || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch" && pointers.current.size === 2) {
      setDraft(clampFill({ ...draft, zoom: (g.z0 * dist()) / g.d0 }));
    } else if (g.kind === "pan") {
      // Dragging right shows more of the photo's left side, like moving a print under a frame.
      const x = g.ox > 0.5 ? g.x0 - ((e.clientX - g.sx) / g.ox) * 100 : draft.x;
      const y = g.oy > 0.5 ? g.y0 - ((e.clientY - g.sy) / g.oy) * 100 : draft.y;
      setDraft(clampFill({ ...draft, x, y }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1 && draft) {
      // One finger left after a pinch: continue as a pan from here.
      const [p] = [...pointers.current.values()];
      const { ox, oy } = overflow(draft);
      gesture.current = { kind: "pan", sx: p.x, sy: p.y, x0: draft.x, y0: draft.y, ox, oy };
    } else if (pointers.current.size === 0) {
      gesture.current = null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 sm:p-6" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={label} className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">{draft ? "Position your photo" : "Add a photo"}</h2>
          <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-paper-2">×</button>
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />

        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => draft && setDraft(clampFill({ ...draft, zoom: draft.zoom - e.deltaY * 0.0015 }))}
          className={`relative mx-auto mt-4 select-none overflow-hidden rounded-md bg-paper-2 shadow-inner ring-1 ring-line ${draft ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
          style={{ aspectRatio: String(aspect), width: `min(100%, calc(55vh * ${aspect}))`, containerType: "size" }}
        >
          {draft && mask ? (
            <>
              <div className="absolute inset-0 opacity-30"><PhotoImg fill={draft} /></div>
              <div className="absolute inset-0" style={{ clipPath: clipPath(mask) }}><PhotoImg fill={draft} /></div>
            </>
          ) : draft ? (
            <PhotoImg fill={draft} />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-4 text-center">
              <div>
                <p className="text-sm text-ink-soft">{busy ? "Uploading your photo…" : "Choose a photo from your gallery"}</p>
                {!busy && (
                  <button type="button" autoFocus onClick={() => inputRef.current?.click()} className="btn btn-primary mt-3">
                    Upload photo
                  </button>
                )}
              </div>
            </div>
          )}
          {mask && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <polygon points={svgPoints(mask)} fill="none" stroke={draft ? "#fff" : "#6b6058"} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray={draft ? undefined : "5 4"} />
            </svg>
          )}
          {draft && busy && <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-semibold">Uploading…</div>}
        </div>

        {error && <p className="mt-3 text-center text-sm font-semibold text-accent" role="alert">{error}</p>}

        {draft && (
          <>
            <p className="mt-2 text-center text-xs text-ink-soft">Drag to move · zoom to crop</p>
            {printMm && <PrintQuality dpi={photoDpi(draft, printMm.w, printMm.h)} />}
            <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
              Zoom
              <input type="range" min={1} max={4} step={0.01} value={draft.zoom}
                onChange={(e) => setDraft(clampFill({ ...draft, zoom: Number(e.target.value) }))}
                className="flex-1 accent-[var(--accent)]" aria-label="Zoom" />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2 text-sm font-semibold">
                <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-full border border-line px-3 py-1.5 hover:border-ink">Change photo</button>
                {fill && (
                  <button type="button" onClick={() => save(null)} className="rounded-full border border-accent/40 px-3 py-1.5 text-accent">Remove</button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={close} className="btn btn-ghost !px-4 !py-2">Cancel</button>
                <button type="button" disabled={busy} onClick={() => save(draft)} className="btn btn-primary !px-5 !py-2">Done</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PrintQuality({ dpi }: { dpi: number }) {
  const q = dpiQuality(dpi);
  return (
    <p className={`mt-1 text-center text-xs font-semibold ${q === "Low" ? "text-accent" : "text-[#3f5e41]"}`}>
      Print quality: {q} ({dpi} dpi){q === "Low" ? " · may look blurry. Zoom out or use a bigger photo." : ""}
    </p>
  );
}
