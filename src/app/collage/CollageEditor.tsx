"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhotoImg } from "@/components/PhotoImg";
import { CollageView } from "@/components/CollageView";
import {
  MIN_SECTION_MM, collagePhotos, fitsMinimum, layout, newNodeId, presetLayout, rectAspect, replaceNode, sheetMm, snapLine,
  type Collage, type CollageNode, type LineBox, type Orientation, type Rect,
} from "@/lib/collage";
import { PRICING, formatRM } from "@/lib/data";
import type { Order, PhotoFill } from "@/lib/types";
import { PhotoEditor } from "../book/PhotoEditor";
import { COLLAGE_DRAFT_KEY, discardPhotoDraft, photoDraftStarted, releaseUnusedPhotos, usePhotoCleanup } from "../book/devicePhotos";
import { newId, setOrder, useOrder } from "../book/orderStore";
import { OrientationToggle } from "./OrientationToggle";
import { ShapesEditor } from "./ShapesEditor";

type Draft = Collage & { editingId: string | null };
const START: Draft = { orientation: "portrait", root: { id: "root", kind: "leaf" }, editingId: null };
const PRESETS = [
  { key: "full", label: "Full page" },
  { key: "a5", label: "2 × A5" },
  { key: "a6", label: "4 × A6" },
  { key: "strips", label: "3 strips" },
  { key: "feature", label: "1 big + 2" },
] as const;

function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(COLLAGE_DRAFT_KEY);
    return raw ? { ...START, ...JSON.parse(raw) } : START;
  } catch {
    return START;
  }
}

/**
 * Two ways to make a photo page: split the sheet into sections, or draw shapes on a blank sheet.
 * Each device works on one photo page at a time: once it's added to the order, the next one can start.
 */
export function CollageEditor() {
  const order = useOrder();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const requested = params.get("mode") === "shapes" ? "shapes" : "split";
  const other = requested === "shapes" ? "split" : "shapes";
  // Already making the other kind of page on this device? Carry on with that one.
  const mode = order && !editId && !photoDraftStarted(requested) && photoDraftStarted(other) ? other : requested;
  const label = (m: "split" | "shapes") => (m === "split" ? "split-page collage" : "photo shapes page");

  function switchTo(target: "split" | "shapes") {
    if (target === mode && !editId) return;
    if (!editId && photoDraftStarted(mode)) {
      if (!confirm(`You can make one photo page at a time. Add your ${label(mode)} to your order first, or discard it to start a ${label(target)}.\n\nDiscard it now?`)) return;
      discardPhotoDraft(mode);
    }
    router.push(target === "shapes" ? "/collage?mode=shapes" : "/collage", { scroll: false });
  }

  return (
    <>
      <nav aria-label="Collage style" className="mb-5 flex w-full max-w-md rounded-full border border-line bg-card p-1 shadow-sm">
        {([
          { key: "split", label: "Split the page", icon: <span className="grid h-4 w-3 grid-rows-2 border-2 border-current"><span className="border-b-2 border-current" /></span> },
          { key: "shapes", label: "Draw shapes", icon: <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current" /> },
        ] as const).map((t) => (
          <button key={t.key} type="button" onClick={() => switchTo(t.key)} aria-current={mode === t.key ? "page" : undefined}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${mode === t.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>
            <span aria-hidden className="grid place-items-center">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      {mode !== requested && (
        <p className="mb-4 rounded-xl bg-mustard/15 px-4 py-3 text-sm" role="status">
          You&apos;re in the middle of a {label(mode)}. Add it to your order (or start over) before making a different one.
        </p>
      )}
      {!order ? (
        <p className="text-ink-soft">Loading…</p>
      ) : mode === "shapes" ? (
        <ShapesEditor key={editId ?? "new"} order={order} editId={editId} />
      ) : (
        <Editor key={editId ?? "new"} order={order} editId={editId} />
      )}
    </>
  );
}

function Editor({ order, editId }: { order: Order; editId: string | null }) {
  const router = useRouter();
  const [draft, setDraftState] = useState<Draft>(() => {
    const page = editId ? order.pages.find((p) => p.id === editId && p.kind === "collage") : null;
    return page && page.kind === "collage" ? { ...page.collage, editingId: page.id } : loadDraft();
  });
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ dir: "v" | "h"; pos: number; rect: Rect } | null>(null);
  const [guide, setGuide] = useState<{ dir: "v" | "h"; pos: number } | null>(null);
  const [hint, setHint] = useState("");
  const [added, setAdded] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<
    | { kind: "line"; line: LineBox; moved: boolean; sx: number; sy: number }
    | { kind: "draw"; leafId: string; rect: Rect; sx: number; sy: number; px: number; py: number }
    | null
  >(null);

  // Undo history
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  usePhotoCleanup(collagePhotos(draft.root).map((f) => f.file));
  const history = useRef<Draft[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const snapshot = () => {
    history.current = [...history.current.slice(-49), draftRef.current];
    setCanUndo(true);
  };
  const setDraft = (fn: (d: Draft) => Draft) =>
    setDraftState((d) => {
      const next = fn(d);
      if (!next.editingId) {
        try { window.localStorage.setItem(COLLAGE_DRAFT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  const commitRoot = (root: CollageNode) => { snapshot(); setDraft((d) => ({ ...d, root })); setAdded(false); };
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setDraft(() => prev);
    setSelectedLine(null);
    setCanUndo(history.current.length > 0);
  };

  const { leaves, lines } = layout(draft.root);
  const sheet = sheetMm(draft.orientation);
  const photoLeaf = leaves.find((l) => l.node.id === photoFor);
  const filled = leaves.filter((l) => l.node.photo).length;
  const lineSel = lines.find((l) => l.node.id === selectedLine);

  /* ── pointer helpers ── */
  const toPct = (e: { clientX: number; clientY: number }) => {
    const r = pageRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  function onPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement;
    const lineEl = target.closest<HTMLElement>("[data-line]");
    const leafEl = target.closest<HTMLElement>("[data-leaf]");
    setHint("");
    if (lineEl) {
      const line = lines.find((l) => l.node.id === lineEl.dataset.line);
      if (!line) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      snapshot();
      gesture.current = { kind: "line", line, moved: false, sx: e.clientX, sy: e.clientY };
    } else if (leafEl) {
      const leafBox = leaves.find((l) => l.node.id === leafEl.dataset.leaf);
      if (!leafBox) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = toPct(e);
      gesture.current = { kind: "draw", leafId: leafBox.node.id, rect: leafBox.rect, sx: e.clientX, sy: e.clientY, px: p.x, py: p.y };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const p = toPct(e);
    if (g.kind === "line") {
      if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 4) return;
      g.moved = true;
      const { node, box } = g.line;
      const raw = node.dir === "v" ? p.x : p.y;
      const others = lines.filter((l) => l.node.id !== node.id);
      const { pos, snapped } = snapLine(raw, node.dir, box, others, draft.orientation);
      const start = node.dir === "v" ? box.x : box.y;
      const span = node.dir === "v" ? box.w : box.h;
      const target = Math.min(97, Math.max(3, ((pos - start) / span) * 100));
      const withAt = (at: number) => replaceNode(draftRef.current.root, node.id, (n) => (n.kind === "split" ? { ...n, at } : n));
      let next = withAt(target);
      if (!fitsMinimum(next, draft.orientation)) {
        // Too far: stop exactly where the smallest section reaches the minimum size.
        const cur = draftRef.current;
        const found = (function find(n: CollageNode): number | null {
          if (n.id === node.id && n.kind === "split") return n.at;
          return n.kind === "split" ? find(n.a) ?? find(n.b) : null;
        })(cur.root);
        let ok = found ?? 50;
        let bad = target;
        for (let i = 0; i < 20; i++) {
          const mid = (ok + bad) / 2;
          if (fitsMinimum(withAt(mid), draft.orientation)) ok = mid;
          else bad = mid;
        }
        next = withAt(ok);
      }
      setDraft((d) => ({ ...d, root: next }));
      setGuide(snapped ? { dir: node.dir, pos } : null);
    } else {
      // Drawing: the longer direction of the drag decides the line's direction.
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.hypot(dx, dy) < 12) return setPreview(null);
      const dir: "v" | "h" = Math.abs(dy) > Math.abs(dx) ? "v" : "h";
      const mid = dir === "v" ? (g.px + p.x) / 2 : (g.py + p.y) / 2;
      const { pos, snapped } = snapLine(mid, dir, g.rect, lines, draft.orientation);
      setPreview({ dir, pos, rect: g.rect });
      setGuide(snapped ? { dir, pos } : null);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const g = gesture.current;
    gesture.current = null;
    setGuide(null);
    if (!g) return;
    if (g.kind === "line") {
      if (!g.moved) {
        history.current.pop(); // nothing changed
        setCanUndo(history.current.length > 0);
        setSelectedLine((s) => (s === g.line.node.id ? null : g.line.node.id));
      } else setAdded(false);
      return;
    }
    const pv = preview;
    setPreview(null);
    if (!pv || Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 12) {
      setSelectedLine(null);
      setPhotoFor(g.leafId); // a tap on a section: add or change its photo
      return;
    }
    const r = g.rect;
    const at = pv.dir === "v" ? ((pv.pos - r.x) / r.w) * 100 : ((pv.pos - r.y) / r.h) * 100;
    const next = replaceNode(draftRef.current.root, g.leafId, (n) => ({
      id: newNodeId(), kind: "split", dir: pv.dir, at, a: n, b: { id: newNodeId(), kind: "leaf" },
    }));
    if (!fitsMinimum(next, draft.orientation)) {
      setHint(`That would make a section smaller than ${MIN_SECTION_MM / 10} cm. Try a bit further from the edge.`);
      return;
    }
    commitRoot(next);
  }

  function removeLine(id: string) {
    const line = lines.find((l) => l.node.id === id);
    if (!line) return;
    const n = line.node;
    if (n.a.kind !== "leaf" || n.b.kind !== "leaf") {
      setHint("Remove the lines inside this part first, then this line.");
      return;
    }
    const photo = n.a.photo ?? n.b.photo;
    commitRoot(replaceNode(draft.root, id, () => ({ id: n.a.id, kind: "leaf", ...(photo ? { photo } : {}) })));
    setSelectedLine(null);
  }

  function applyPreset(key: (typeof PRESETS)[number]["key"]) {
    // Keep the customer's photos, placing them into the new sections in order.
    const photos = collagePhotos(draft.root);
    let root = presetLayout(key, draft.orientation);
    let i = 0;
    for (const l of layout(root).leaves) {
      const photo = photos[i++];
      if (!photo) break;
      root = replaceNode(root, l.node.id, (n) => ({ ...n, photo }) as CollageNode);
    }
    setSelectedLine(null);
    commitRoot(root);
  }

  function setOrientation(o: Orientation) {
    if (o === draft.orientation) return;
    snapshot();
    setDraft((d) => ({ ...d, orientation: o }));
    setAdded(false);
  }

  function savePhoto(fill: PhotoFill | null) {
    const id = photoFor!;
    commitRoot(replaceNode(draft.root, id, (n) => (n.kind === "leaf" ? { id: n.id, kind: "leaf", ...(fill ? { photo: fill } : {}) } : n)));
    setPhotoFor(null);
  }

  function addToOrder() {
    const empty = leaves.length - filled;
    if (empty > 0 && !confirm(`${empty} section${empty === 1 ? " has" : "s have"} no photo yet and will print blank. Add the collage anyway?`)) return;
    const page = { kind: "collage" as const, id: draft.editingId ?? newId(), collage: { orientation: draft.orientation, root: draft.root } };
    setOrder((o) => ({
      ...o,
      pages: draft.editingId && o.pages.some((p) => p.id === draft.editingId)
        ? o.pages.map((p) => (p.id === draft.editingId ? page : p))
        : [...o.pages, page],
    }));
    if (draft.editingId) {
      releaseUnusedPhotos();
      return router.push("/book");
    }
    setAdded(true);
    history.current = [];
    setCanUndo(false);
    setDraft(() => ({ ...START, orientation: draft.orientation }));
    setTimeout(() => releaseUnusedPhotos()); // photos replaced along the way are no longer needed
  }

  function startOver() {
    if (!confirm("Start over? This clears the page and deletes its photos.")) return;
    history.current = [];
    setCanUndo(false);
    setSelectedLine(null);
    setDraft((d) => ({ ...START, orientation: d.orientation, editingId: d.editingId }));
    setTimeout(() => releaseUnusedPhotos());
  }

  // Keyboard: Ctrl/Cmd+Z undo, Delete removes the selected line.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName) || photoFor) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selectedLine) { e.preventDefault(); removeLine(selectedLine); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const lineStyle = (dir: "v" | "h", pos: number, r: Rect): React.CSSProperties =>
    dir === "v"
      ? { left: `${pos}%`, top: `${r.y}%`, height: `${r.h}%`, width: 0 }
      : { top: `${pos}%`, left: `${r.x}%`, width: `${r.w}%`, height: 0 };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Sheet */}
      <section aria-label="Your collage" className="rounded-2xl bg-paper-2 p-4 sm:p-8">
        <div
          ref={pageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { gesture.current = null; setPreview(null); setGuide(null); }}
          className="relative mx-auto w-full touch-none select-none overflow-hidden bg-white shadow-xl"
          style={{ aspectRatio: `${sheet.w} / ${sheet.h}`, maxWidth: draft.orientation === "portrait" ? 440 : 620 }}
        >
          {leaves.map(({ node, rect }) => {
            const wCm = ((rect.w / 100) * sheet.w) / 10;
            const hCm = ((rect.h / 100) * sheet.h) / 10;
            return (
              <div
                key={node.id}
                data-leaf={node.id}
                className="group absolute cursor-crosshair overflow-hidden bg-paper-2/60"
                style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%`, containerType: "size" }}
              >
                {node.photo ? (
                  <PhotoImg fill={node.photo} />
                ) : (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center p-1 text-center">
                    <span>
                      <span className="block rounded-full bg-white px-[0.7em] py-[0.3em] font-bold leading-none text-ink shadow" style={{ fontSize: "clamp(9px, 9cqmin, 14px)" }}>
                        ＋ Add photo
                      </span>
                      <span className="mt-1 block text-ink-soft" style={{ fontSize: "clamp(8px, 6cqmin, 12px)" }}>
                        {wCm.toFixed(1)} × {hCm.toFixed(1)} cm
                      </span>
                    </span>
                  </span>
                )}
              </div>
            );
          })}

          {lines.map(({ node, box, pos }) => {
            const sel = node.id === selectedLine;
            return (
              <div key={node.id} className="absolute" style={lineStyle(node.dir, pos, box)}>
                <div
                  data-line={node.id}
                  role="button"
                  aria-label={`${node.dir === "v" ? "Vertical" : "Horizontal"} line`}
                  className={`absolute ${node.dir === "v" ? "-left-2.5 top-0 h-full w-5 cursor-col-resize" : "-top-2.5 left-0 h-5 w-full cursor-row-resize"} group/line`}
                >
                  <span className={`pointer-events-none absolute ${node.dir === "v" ? "left-1/2 top-0 h-full w-[3px] -translate-x-1/2" : "left-0 top-1/2 h-[3px] w-full -translate-y-1/2"} ${sel ? "bg-accent" : "bg-white shadow-[0_0_0_1px_rgba(42,36,32,.35)] group-hover/line:bg-mustard"}`} />
                  <span className={`pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${sel ? "bg-accent" : "bg-ink/70"}`} />
                </div>
              </div>
            );
          })}

          {preview && (
            <div className="pointer-events-none absolute" style={lineStyle(preview.dir, preview.pos, preview.rect)}>
              <span className={`absolute ${preview.dir === "v" ? "left-1/2 top-0 h-full -translate-x-1/2 border-l-[3px]" : "left-0 top-1/2 w-full -translate-y-1/2 border-t-[3px]"} border-dashed border-accent`} />
            </div>
          )}
          {guide && (
            <div
              className={`pointer-events-none absolute bg-sage ${guide.dir === "v" ? "top-0 h-full w-px" : "left-0 h-px w-full"}`}
              style={guide.dir === "v" ? { left: `${guide.pos}%` } : { top: `${guide.pos}%` }}
            />
          )}
        </div>

        <div className="mx-auto mt-3 flex max-w-[620px] flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-soft">
            Draw across a section to split it · drag a line to move it · tap a section for its photo
          </p>
          <div className="flex gap-2 text-xs font-semibold">
            <button type="button" onClick={undo} disabled={!canUndo} className="rounded-full border border-line bg-white px-3 py-1.5 disabled:opacity-40">↶ Undo</button>
            {lineSel && (
              <button type="button" onClick={() => removeLine(lineSel.node.id)} className="rounded-full border border-accent/40 bg-white px-3 py-1.5 text-accent">Remove line</button>
            )}
          </div>
        </div>
        {hint && <p className="mt-2 text-center text-sm font-semibold text-accent" role="alert">{hint}</p>}
      </section>

      {/* Tools */}
      <section aria-label="Collage tools" className="flex flex-col gap-5 rounded-2xl bg-card p-4 shadow-sm">
        <OrientationToggle value={draft.orientation} onChange={setOrientation} />

        <div>
          <h2 className="text-sm font-semibold">Quick layouts</h2>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button key={p.key} type="button" onClick={() => applyPreset(p.key)} title={p.label}
                className="flex flex-col items-center gap-1 rounded-lg border border-line p-1.5 text-[11px] font-semibold hover:border-ink">
                <PresetIcon root={presetLayout(p.key, draft.orientation)} orientation={draft.orientation} />
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-soft">Your photos move into the new layout. Undo if you change your mind.</p>
          {(lines.length > 0 || filled > 0) && !draft.editingId && (
            <button type="button" onClick={startOver} className="mt-2 text-xs font-semibold text-accent hover:underline">Start over</button>
          )}
        </div>

        <div className="rounded-xl bg-paper-2 p-3 text-sm">
          <p className="font-semibold">How it works</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">
            <li>Draw a line across a section to split it. It reaches the edges of that section and never crosses another line.</li>
            <li>Drag a line to move it. It snaps to halves, thirds and other lines.</li>
            <li>Tap a line, then <em>Remove line</em> to join two sections again.</li>
            <li>Tap a section to add your photo, then move and zoom it to crop.</li>
          </ul>
        </div>

        <div className="mt-auto border-t border-line pt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-soft">{leaves.length} section{leaves.length === 1 ? "" : "s"} · {filled} photo{filled === 1 ? "" : "s"} × {formatRM(PRICING.photoPrint)}</span>
            <span className="font-display text-2xl font-semibold">{formatRM(filled * PRICING.photoPrint)}</span>
          </div>
          {added ? (
            <div className="mt-3 rounded-xl bg-sage/15 p-3 text-sm">
              <p className="font-semibold text-[#3f5e41]">✓ Collage added to your order</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/book/time" className="btn btn-primary !px-4 !py-2 text-sm">Next: choose your time →</Link>
                <button type="button" onClick={() => setAdded(false)} className="btn btn-ghost !px-4 !py-2 text-sm">Make another</button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" onClick={addToOrder} disabled={filled === 0} className="btn btn-primary mt-3 w-full disabled:opacity-50">
                {draft.editingId ? "Save changes" : "Add collage to my order"}
              </button>
              {filled === 0 && <p className="mt-1 text-center text-xs text-ink-soft">Add at least one photo first.</p>}
              {draft.editingId && (
                <Link href="/book" className="mt-2 block text-center text-sm text-ink-soft hover:text-accent">Cancel editing</Link>
              )}
            </>
          )}
          {order.pages.length > 0 && !added && (
            <p className="mt-3 text-center text-xs text-ink-soft">
              {order.pages.length} page{order.pages.length === 1 ? "" : "s"} in your order · <Link href="/book" className="underline">view</Link>
            </p>
          )}
        </div>
      </section>

      {photoLeaf && (
        <PhotoEditor
          aspect={rectAspect(photoLeaf.rect, draft.orientation)}
          printMm={{ w: (photoLeaf.rect.w / 100) * sheet.w, h: (photoLeaf.rect.h / 100) * sheet.h }}
          fill={photoLeaf.node.photo}
          label="Photo for this section"
          onClose={() => setPhotoFor(null)}
          onSave={savePhoto}
        />
      )}
    </div>
  );
}

function PresetIcon({ root, orientation }: { root: CollageNode; orientation: Orientation }) {
  return <CollageView collage={{ orientation, root }} className={`!shadow-none ring-1 ring-line ${orientation === "portrait" ? "w-6" : "w-9"}`} />;
}
