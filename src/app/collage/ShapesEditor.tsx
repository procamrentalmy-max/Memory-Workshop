"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhotoImg } from "@/components/PhotoImg";
import { newNodeId, sheetMm, type Orientation } from "@/lib/collage";
import { PRICING, formatRM } from "@/lib/data";
import {
  MAX_SHAPES, MIN_SHAPE_MM, SHAPE_KINDS, clipPath, defaultShapeMm, fitOnPage, freeShapeFromPath, minShapePct, outlineMm,
  reorient, shapeMm, shapeOutline, snapEdges, snapTargets, svgPoints,
  type PhotoShape, type Pt, type ShapeKind, type ShapeSheet,
} from "@/lib/shapes";
import type { Order, PhotoFill } from "@/lib/types";
import { PhotoEditor } from "../book/PhotoEditor";
import { SHAPES_DRAFT_KEY, releaseUnusedPhotos, usePhotoCleanup } from "../book/devicePhotos";
import { useStudioCode } from "../print/studioMode";
import { newId, setOrder } from "../book/orderStore";
import { OrientationToggle } from "./OrientationToggle";

type Draft = ShapeSheet & { editingId: string | null };
const START: Draft = { orientation: "portrait", shapes: [], editingId: null };

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const HANDLES: { h: Handle; x: number; y: number; cursor: string }[] = [
  { h: "nw", x: 0, y: 0, cursor: "nwse-resize" }, { h: "n", x: 50, y: 0, cursor: "ns-resize" },
  { h: "ne", x: 100, y: 0, cursor: "nesw-resize" }, { h: "e", x: 100, y: 50, cursor: "ew-resize" },
  { h: "se", x: 100, y: 100, cursor: "nwse-resize" }, { h: "s", x: 50, y: 100, cursor: "ns-resize" },
  { h: "sw", x: 0, y: 100, cursor: "nesw-resize" }, { h: "w", x: 0, y: 50, cursor: "ew-resize" },
];
type Box = { x: number; y: number; w: number; h: number };
type Gesture =
  | { kind: "draw"; sx: number; sy: number; p0: { x: number; y: number }; moved: boolean; box: (Box & { square: boolean }) | null }
  | { kind: "free"; sx: number; sy: number; path: Pt[]; moved: boolean }
  | { kind: "move"; id: string; sx: number; sy: number; p0: { x: number; y: number }; start: PhotoShape; moved: boolean; wasSelected: boolean }
  | { kind: "resize"; id: string; handle: Handle; start: PhotoShape; moved: boolean };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const labelOf = (k: ShapeKind) => SHAPE_KINDS.find((s) => s.kind === k)?.label ?? "Shape";
const cm = (mm: number) => (mm / 10).toFixed(1);

function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(SHAPES_DRAFT_KEY);
    return raw ? { ...START, ...JSON.parse(raw) } : START;
  } catch {
    return START;
  }
}

export function ShapesEditor({ order, editId }: { order: Order; editId: string | null }) {
  const studio = useStudioCode(); // at the studio: pages go straight to print
  const router = useRouter();
  const [draft, setDraftState] = useState<Draft>(() => {
    const page = editId ? order.pages.find((p) => p.id === editId && p.kind === "shapes") : null;
    return page && page.kind === "shapes" ? { ...page.sheet, editingId: page.id } : loadDraft();
  });
  const [tool, setTool] = useState<ShapeKind>("circle");
  const [selected, setSelected] = useState<string | null>(null);
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [preview, setPreview] = useState<(Box & { square: boolean }) | { path: Pt[] } | null>(null);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [hint, setHint] = useState("");
  const [added, setAdded] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);

  // Undo history
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  usePhotoCleanup(draft.shapes.flatMap((s) => (s.photo ? [s.photo.file] : [])));
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
        try { window.localStorage.setItem(SHAPES_DRAFT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  const setShapes = (fn: (s: PhotoShape[]) => PhotoShape[]) => { setDraft((d) => ({ ...d, shapes: fn(d.shapes) })); setAdded(false); };
  const updateShape = (id: string, fn: (s: PhotoShape) => PhotoShape) => setShapes((list) => list.map((s) => (s.id === id ? fn(s) : s)));
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setDraft(() => prev);
    setCanUndo(history.current.length > 0);
    setAdded(false);
  };

  const o = draft.orientation;
  const sheet = sheetMm(o);
  const shapes = draft.shapes;
  const sel = shapes.find((s) => s.id === selected) ?? null;
  const photoShape = shapes.find((s) => s.id === photoFor);
  const photos = shapes.filter((s) => s.photo).length;

  /* ── pointer helpers ── */
  const toPct = (e: { clientX: number; clientY: number }) => {
    const r = pageRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const onPage = (p: { x: number; y: number }) => ({ x: clamp(p.x, 0, 100), y: clamp(p.y, 0, 100) });

  /** Snaps a point (the corner being drawn) to the page and other shapes. */
  function snapPoint(p: { x: number; y: number }, gx: number[], gy: number[]) {
    const T = snapTargets(draftRef.current.shapes, null);
    const sx = snapEdges([p.x], T.x, "x", o);
    const sy = snapEdges([p.y], T.y, "y", o);
    if (sx) gx.push(sx.at);
    if (sy) gy.push(sy.at);
    return { x: p.x + (sx?.delta ?? 0), y: p.y + (sy?.delta ?? 0) };
  }

  function drawBox(p0: { x: number; y: number }, raw: { x: number; y: number }) {
    const gx: number[] = [];
    const gy: number[] = [];
    const q = snapPoint(onPage(raw), gx, gy);
    let w = Math.abs(q.x - p0.x);
    let h = Math.abs(q.y - p0.y);
    // Nearly square → exactly square (perfect circles, stars and hearts).
    const mm = shapeMm({ w, h }, o);
    let square = false;
    if (mm.w > 5 && mm.h > 5 && Math.abs(mm.w - mm.h) / Math.max(mm.w, mm.h) < 0.07) {
      const side = Math.max(mm.w, mm.h);
      if (mm.w < side) gx.length = 0;
      else gy.length = 0;
      w = (side / sheet.w) * 100;
      h = (side / sheet.h) * 100;
      square = true;
    }
    let x = q.x < p0.x ? p0.x - w : p0.x;
    let y = q.y < p0.y ? p0.y - h : p0.y;
    if (x < 0 || y < 0 || x + w > 100 || y + h > 100) {
      // Squaring pushed it off the page: keep it on, and give up the exact square.
      x = clamp(x, 0, 100);
      y = clamp(y, 0, 100);
      w = Math.min(w, 100 - x);
      h = Math.min(h, 100 - y);
      square = false;
    }
    setGuides({ x: gx, y: gy });
    return { x, y, w, h, square };
  }

  function addShape(s: Omit<PhotoShape, "id">) {
    if (draftRef.current.shapes.length >= MAX_SHAPES) {
      setHint(`A sheet can hold up to ${MAX_SHAPES} shapes.`);
      return;
    }
    snapshot();
    const id = newNodeId();
    setShapes((list) => [...list, { ...fitOnPage(s, o), id }]);
    setSelected(id);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (gesture.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    setHint("");
    const t = e.target as HTMLElement;
    const handleEl = t.closest<HTMLElement>("[data-handle]");
    const shapeEl = t.closest<HTMLElement>("[data-shape]");
    const p = toPct(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (handleEl && sel) {
      gesture.current = { kind: "resize", id: sel.id, handle: handleEl.dataset.handle as Handle, start: sel, moved: false };
    } else if (shapeEl) {
      const s = shapes.find((x) => x.id === shapeEl.dataset.shape);
      if (!s) return;
      gesture.current = { kind: "move", id: s.id, sx: e.clientX, sy: e.clientY, p0: p, start: s, moved: false, wasSelected: selected === s.id };
      setSelected(s.id);
    } else if (tool === "free") {
      gesture.current = { kind: "free", sx: e.clientX, sy: e.clientY, path: [[clamp(p.x, 0, 100), clamp(p.y, 0, 100)]], moved: false };
    } else {
      gesture.current = { kind: "draw", sx: e.clientX, sy: e.clientY, p0: snapPoint(onPage(p), [], []), moved: false, box: null };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const p = toPct(e);
    const far = g.kind === "resize" || Math.hypot(e.clientX - g.sx, e.clientY - g.sy) >= 6;
    if (!g.moved) {
      if (!far) return;
      g.moved = true;
      if (g.kind === "move" || g.kind === "resize") snapshot();
    }

    if (g.kind === "move") {
      const s = g.start;
      const T = snapTargets(draftRef.current.shapes, s.id);
      let x = clamp(s.x + p.x - g.p0.x, 0, 100 - s.w);
      let y = clamp(s.y + p.y - g.p0.y, 0, 100 - s.h);
      const sx = snapEdges([x, x + s.w / 2, x + s.w], T.x, "x", o);
      const sy = snapEdges([y, y + s.h / 2, y + s.h], T.y, "y", o);
      if (sx) x = clamp(x + sx.delta, 0, 100 - s.w);
      if (sy) y = clamp(y + sy.delta, 0, 100 - s.h);
      setGuides({ x: sx ? [sx.at] : [], y: sy ? [sy.at] : [] });
      updateShape(s.id, (c) => ({ ...c, x, y }));
    } else if (g.kind === "resize") {
      updateShape(g.id, (c) => ({ ...c, ...resizeBox(g.start, g.handle, p) }));
    } else if (g.kind === "draw") {
      g.box = drawBox(g.p0, p);
      setPreview(g.box);
    } else {
      const last = g.path[g.path.length - 1];
      const q: Pt = [clamp(p.x, 0, 100), clamp(p.y, 0, 100)];
      // Record a point every ~1 mm of movement.
      if (g.path.length < 4000 && Math.hypot(((q[0] - last[0]) / 100) * sheet.w, ((q[1] - last[1]) / 100) * sheet.h) >= 1) {
        g.path.push(q);
        setPreview({ path: [...g.path] });
      }
    }
  }

  /** Side handles stretch one side; corner handles keep the shape's proportions. Edges snap to guides. */
  function resizeBox(s: PhotoShape, handle: Handle, p: { x: number; y: number }): Box {
    const min = minShapePct(o);
    const T = snapTargets(draftRef.current.shapes, s.id);
    const gx: number[] = [];
    const gy: number[] = [];
    const right = s.x + s.w;
    const bottom = s.y + s.h;
    const edge = (v: number, axis: "x" | "y", lo: number, hi: number) => {
      let at = clamp(v, lo, hi);
      const sn = snapEdges([at], axis === "x" ? T.x : T.y, axis, o);
      if (sn && at + sn.delta >= lo && at + sn.delta <= hi) {
        at += sn.delta;
        (axis === "x" ? gx : gy).push(sn.at);
      }
      return at;
    };
    let box: Box = { x: s.x, y: s.y, w: s.w, h: s.h };
    if (handle === "e") box.w = edge(p.x, "x", s.x + min.w, 100) - s.x;
    else if (handle === "w") { const l = edge(p.x, "x", 0, right - min.w); box = { ...box, x: l, w: right - l }; }
    else if (handle === "s") box.h = edge(p.y, "y", s.y + min.h, 100) - s.y;
    else if (handle === "n") { const tp = edge(p.y, "y", 0, bottom - min.h); box = { ...box, y: tp, h: bottom - tp }; }
    else {
      const east = handle.includes("e");
      const south = handle.includes("s");
      const ax = east ? s.x : right; // the opposite corner stays put
      const ay = south ? s.y : bottom;
      const dx = east ? 1 : -1;
      const dy = south ? 1 : -1;
      let k = Math.max(((p.x - ax) * dx) / s.w, ((p.y - ay) * dy) / s.h);
      const snx = snapEdges([ax + dx * s.w * k], T.x, "x", o);
      const sny = snapEdges([ay + dy * s.h * k], T.y, "y", o);
      const mmX = snx ? (Math.abs(snx.delta) / 100) * sheet.w : Infinity;
      const mmY = sny ? (Math.abs(sny.delta) / 100) * sheet.h : Infinity;
      if (snx && mmX <= mmY) { k = ((snx.at - ax) * dx) / s.w; gx.push(snx.at); }
      else if (sny) { k = ((sny.at - ay) * dy) / s.h; gy.push(sny.at); }
      const kMin = Math.max(min.w / s.w, min.h / s.h);
      const kMax = Math.min((east ? 100 - ax : ax) / s.w, (south ? 100 - ay : ay) / s.h);
      const kc = clamp(k, kMin, kMax);
      if (kc !== k) { gx.length = 0; gy.length = 0; }
      const w = s.w * kc;
      const h = s.h * kc;
      box = { x: east ? ax : ax - w, y: south ? ay : ay - h, w, h };
    }
    setGuides({ x: gx, y: gy });
    return box;
  }

  function onPointerUp(e: React.PointerEvent) {
    const g = gesture.current;
    gesture.current = null;
    setGuides({ x: [], y: [] });
    setPreview(null);
    if (!g) return;
    if (g.kind === "move") {
      // A tap on a shape selects it; tapping it again (or tapping an empty shape) opens its photo.
      if (!g.moved && (g.wasSelected || !g.start.photo)) setPhotoFor(g.id);
      return;
    }
    if (g.kind === "resize") return;
    if (!g.moved) {
      // A tap on the blank paper: let go of the selected shape, or drop a new shape there.
      if (selected) return setSelected(null);
      if (tool === "free") return setHint("Draw the outline of your shape with your finger or mouse.");
      const p = onPage(toPct(e));
      const [wMm, hMm] = defaultShapeMm(tool);
      const w = (Math.min(wMm, sheet.w) / sheet.w) * 100;
      const h = (Math.min(hMm, sheet.h) / sheet.h) * 100;
      return addShape({ kind: tool, x: p.x - w / 2, y: p.y - h / 2, w, h });
    }
    if (g.kind === "free") {
      const made = freeShapeFromPath(g.path, o);
      if (!made) return setHint(`Draw a bigger shape, at least ${MIN_SHAPE_MM / 10} cm across.`);
      return addShape(made);
    }
    if (g.box) addShape({ kind: tool, x: g.box.x, y: g.box.y, w: g.box.w, h: g.box.h });
  }

  /* ── selected shape actions ── */
  function removeShape(id: string) {
    snapshot();
    setShapes((list) => list.filter((s) => s.id !== id));
    setSelected(null);
  }
  function duplicate(s: PhotoShape) {
    if (shapes.length >= MAX_SHAPES) return setHint(`A sheet can hold up to ${MAX_SHAPES} shapes.`);
    snapshot();
    const id = newNodeId();
    const copy = fitOnPage({ ...s, id, x: s.x + (8 / sheet.w) * 100, y: s.y + (8 / sheet.h) * 100 }, o);
    setShapes((list) => [...list, copy]);
    setSelected(id);
  }
  function reorder(id: string, to: "front" | "back") {
    snapshot();
    setShapes((list) => {
      const s = list.find((x) => x.id === id)!;
      const rest = list.filter((x) => x.id !== id);
      return to === "front" ? [...rest, s] : [s, ...rest];
    });
  }
  function changeKind(id: string, kind: ShapeKind) {
    snapshot();
    updateShape(id, (s) => {
      const { points: _drop, ...rest } = s;
      void _drop;
      return { ...rest, kind };
    });
  }
  function savePhoto(fill: PhotoFill | null) {
    const id = photoFor!;
    snapshot();
    updateShape(id, (s) => {
      const { photo: _old, ...rest } = s;
      void _old;
      return fill ? { ...rest, photo: fill } : rest;
    });
    setPhotoFor(null);
  }
  function setOrientation(next: Orientation) {
    if (next === o) return;
    snapshot();
    setDraft((d) => ({ ...d, orientation: next, shapes: reorient(d.shapes, d.orientation, next) }));
    setAdded(false);
  }
  function startOver() {
    if (!shapes.length || !confirm("Start over? This clears the page and deletes its photos.")) return;
    history.current = [];
    setCanUndo(false);
    setShapes(() => []);
    setSelected(null);
    setTimeout(() => releaseUnusedPhotos());
  }

  function addToOrder() {
    const empty = shapes.length - photos;
    if (empty > 0 && !confirm(`${empty} shape${empty === 1 ? " has" : "s have"} no photo yet and will be left off the print. Add to your order anyway?`)) return;
    const page = { kind: "shapes" as const, id: draft.editingId ?? newId(), sheet: { orientation: o, shapes: shapes.filter((s) => s.photo) } };
    setOrder((ord) => ({
      ...ord,
      pages: draft.editingId && ord.pages.some((p) => p.id === draft.editingId)
        ? ord.pages.map((p) => (p.id === draft.editingId ? page : p))
        : [...ord.pages, page],
    }));
    if (draft.editingId) {
      releaseUnusedPhotos();
      return router.push(studio ? "/print" : "/book");
    }
    setAdded(true);
    setSelected(null);
    history.current = [];
    setCanUndo(false);
    setDraft(() => ({ ...START, orientation: o }));
    setTimeout(() => releaseUnusedPhotos()); // photos replaced along the way are no longer needed
  }

  // Keyboard: Ctrl/Cmd+Z undo, Delete removes the selected shape, arrows nudge it 1 mm (Shift: 5 mm), Esc lets go.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName) || photoFor) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
      if (!sel) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeShape(sel.id); }
      else if (e.key === "Escape") setSelected(null);
      else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        snapshot();
        updateShape(sel.id, (s) => fitOnPage({ ...s, x: s.x + (dx / sheet.w) * 100, y: s.y + (dy / sheet.h) * 100 }, o));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selMm = sel ? shapeMm(sel, o) : null;
  const pv = preview && "square" in preview ? preview : null;
  const path = preview && "path" in preview ? preview.path : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Sheet */}
      <section aria-label="Your photo shapes" className="rounded-2xl bg-paper-2 p-4 sm:p-8">
        <div
          ref={pageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { gesture.current = null; setPreview(null); setGuides({ x: [], y: [] }); }}
          className="relative mx-auto w-full cursor-crosshair touch-none select-none bg-white shadow-xl"
          style={{ aspectRatio: `${sheet.w} / ${sheet.h}`, maxWidth: o === "portrait" ? 440 : 620 }}
        >
          {shapes.length === 0 && !preview && (
            <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm text-ink-soft">
              <p className="font-hand text-2xl text-accent">a blank A4 page</p>
              <p className="mt-1">
                {tool === "free" ? "Draw the outline of a shape" : `Drag to draw a ${labelOf(tool).toLowerCase()}, or tap to drop one in`}
              </p>
            </div>
          )}

          {shapes.map((s) => <ShapeOnPage key={s.id} shape={s} orientation={o} selected={s.id === selected} />)}

          {/* Selection box with resize handles, above every shape */}
          {sel && selMm && (
            <div className="pointer-events-none absolute outline-1 outline-offset-0 outline-accent/50 [outline-style:dashed]" style={{ left: `${sel.x}%`, top: `${sel.y}%`, width: `${sel.w}%`, height: `${sel.h}%` }}>
              {HANDLES.filter((hd) => hd.h.length === 2 || (selMm.w >= 30 && selMm.h >= 30)).map((hd) => (
                <span
                  key={hd.h}
                  data-handle={hd.h}
                  aria-label={`Resize ${hd.h}`}
                  className="pointer-events-auto absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
                  style={{ left: `${hd.x}%`, top: `${hd.y}%`, cursor: hd.cursor }}
                >
                  <span className={`block border-2 border-accent bg-white shadow ${hd.h.length === 2 ? "h-4 w-4 rounded-full" : "h-3 w-3 rounded-sm"}`} />
                </span>
              ))}
            </div>
          )}

          {/* Shape being drawn */}
          {pv && (
            <div className="pointer-events-none absolute" style={{ left: `${pv.x}%`, top: `${pv.y}%`, width: `${pv.w}%`, height: `${pv.h}%` }}>
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <polygon points={svgPoints(shapeOutline({ kind: tool, w: pv.w, h: pv.h }, o))} className="fill-accent/10 stroke-accent" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">
                {cm(shapeMm(pv, o).w)} × {cm(shapeMm(pv, o).h)} cm{pv.square ? " · 1:1" : ""}
              </span>
            </div>
          )}
          {path && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <polyline points={svgPoints(path)} fill="none" className="stroke-accent" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {path.length > 2 && (
                <line x1={path[path.length - 1][0]} y1={path[path.length - 1][1]} x2={path[0][0]} y2={path[0][1]} className="stroke-accent/50" strokeWidth={2} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              )}
            </svg>
          )}

          {/* Snap guides */}
          {guides.x.map((x, i) => <div key={`x${i}`} className="pointer-events-none absolute top-0 h-full w-px bg-sage" style={{ left: `${x}%` }} />)}
          {guides.y.map((y, i) => <div key={`y${i}`} className="pointer-events-none absolute left-0 h-px w-full bg-sage" style={{ top: `${y}%` }} />)}
        </div>

        <div className="mx-auto mt-3 flex max-w-[620px] flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-soft">
            {sel && selMm
              ? `${labelOf(sel.kind)} · ${cm(selMm.w)} × ${cm(selMm.h)} cm`
              : "Drag on the paper to draw · drag a shape to move it · tap it for its photo"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <button type="button" onClick={undo} disabled={!canUndo} className="rounded-full border border-line bg-white px-3 py-1.5 disabled:opacity-40">↶ Undo</button>
            {sel && (
              <>
                <button type="button" onClick={() => setPhotoFor(sel.id)} className="rounded-full bg-ink px-3 py-1.5 text-paper">{sel.photo ? "Change photo" : "＋ Add photo"}</button>
                <button type="button" onClick={() => duplicate(sel)} className="rounded-full border border-line bg-white px-3 py-1.5">Duplicate</button>
                <button type="button" onClick={() => removeShape(sel.id)} className="rounded-full border border-accent/40 bg-white px-3 py-1.5 text-accent">Delete</button>
              </>
            )}
          </div>
        </div>
        {hint && <p className="mt-2 text-center text-sm font-semibold text-accent" role="alert">{hint}</p>}
      </section>

      {/* Tools */}
      <section aria-label="Shape tools" className="flex flex-col gap-5 rounded-2xl bg-card p-4 shadow-sm">
        <OrientationToggle value={o} onChange={setOrientation} />

        <div>
          <h2 className="text-sm font-semibold">Draw a shape</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SHAPE_KINDS.map(({ kind, label }) => (
              <button key={kind} type="button" onClick={() => setTool(kind)} aria-pressed={tool === kind}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-semibold ${tool === kind ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
                <ShapeIcon kind={kind} />
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {tool === "free"
              ? "Draw the outline in one go. We join up the ends for you."
              : "Drag on the paper to draw it, or tap the paper to drop one in. Almost-square shapes snap to perfectly round."}
          </p>
        </div>

        {sel && (
          <div className="rounded-xl border border-line p-3">
            <h2 className="text-sm font-semibold">Selected shape</h2>
            <p className="mt-1 text-xs text-ink-soft">Change it to</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {SHAPE_KINDS.filter((k) => k.kind !== "free").map(({ kind, label }) => (
                <button key={kind} type="button" title={label} aria-label={`Change to ${label}`} aria-pressed={sel.kind === kind}
                  onClick={() => sel.kind !== kind && changeKind(sel.id, kind)}
                  className={`grid h-8 w-8 place-items-center rounded-lg border ${sel.kind === kind ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
                  <ShapeIcon kind={kind} small />
                </button>
              ))}
            </div>
            {shapes.length > 1 && (
              <div className="mt-3 flex gap-2 text-xs font-semibold">
                <button type="button" onClick={() => reorder(sel.id, "front")} className="rounded-full border border-line px-3 py-1.5 hover:border-ink">Bring to front</button>
                <button type="button" onClick={() => reorder(sel.id, "back")} className="rounded-full border border-line px-3 py-1.5 hover:border-ink">Send to back</button>
              </div>
            )}
            <p className="mt-2 text-xs text-ink-soft">Drag the corner dots to resize (keeps its shape) or the side dots to stretch it.</p>
          </div>
        )}

        <div className="rounded-xl bg-paper-2 p-3 text-sm">
          <p className="font-semibold">How it works</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">
            <li>Pick a shape, then drag on the paper to draw it, or choose <em>Draw your own</em> and trace any outline.</li>
            <li>Drag a shape to move it. It snaps to the middle and edges of the page and lines up with other shapes.</li>
            <li>Tap a shape to add your photo, then move and zoom it to crop.</li>
          </ul>
          {shapes.length > 0 && (
            <button type="button" onClick={startOver} className="mt-2 text-xs font-semibold text-accent hover:underline">Start over</button>
          )}
        </div>

        <div className="mt-auto border-t border-line pt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-soft">{shapes.length} shape{shapes.length === 1 ? "" : "s"}</span>
            <span className="font-display text-2xl font-semibold">{photos} photo{photos === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Memory Maker includes 1 sheet (2 A5 prints), Complete Memory 2. Extra sheets {formatRM(PRICING.photoSheet)} each.</p>
          {added ? (
            <div className="mt-3 rounded-xl bg-sage/15 p-3 text-sm">
              <p className="font-semibold text-[#3f5e41]">✓ Photo page added to your order</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {studio ? (
                  <Link href="/print" className="btn btn-primary !px-4 !py-2 text-sm">Send to print →</Link>
                ) : (
                  <Link href="/book/time" className="btn btn-primary !px-4 !py-2 text-sm">Next: choose your time →</Link>
                )}
                <button type="button" onClick={() => setAdded(false)} className="btn btn-ghost !px-4 !py-2 text-sm">Make another</button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" onClick={addToOrder} disabled={photos === 0} className="btn btn-primary mt-3 w-full disabled:opacity-50">
                {draft.editingId ? "Save changes" : "Add to my order"}
              </button>
              {photos === 0 && <p className="mt-1 text-center text-xs text-ink-soft">Add at least one photo first.</p>}
              {draft.editingId && (
                <Link href={studio ? "/print" : "/book"} className="mt-2 block text-center text-sm text-ink-soft hover:text-accent">Cancel editing</Link>
              )}
            </>
          )}
          {order.pages.length > 0 && !added && (
            <p className="mt-3 text-center text-xs text-ink-soft">
              {order.pages.length} page{order.pages.length === 1 ? "" : "s"} in your order · <Link href={studio ? "/print" : "/book"} className="underline">{studio ? "send to print" : "view"}</Link>
            </p>
          )}
        </div>
      </section>

      {photoShape && (
        <PhotoEditor
          aspect={shapeMm(photoShape, o).w / shapeMm(photoShape, o).h}
          fill={photoShape.photo}
          mask={shapeOutline(photoShape, o)}
          printMm={shapeMm(photoShape, o)}
          label={`Photo for this ${labelOf(photoShape.kind).toLowerCase()}`}
          onClose={() => setPhotoFor(null)}
          onSave={savePhoto}
        />
      )}
    </div>
  );
}

function ShapeOnPage({ shape: s, orientation, selected }: { shape: PhotoShape; orientation: Orientation; selected: boolean }) {
  const pts = shapeOutline(s, orientation);
  const mm = shapeMm(s, orientation);
  return (
    <div className="pointer-events-none absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` }}>
      {/* The clip-path also limits where it can be grabbed, so only the shape itself is clickable. */}
      <div
        data-shape={s.id}
        className={`pointer-events-auto absolute inset-0 cursor-move overflow-hidden ${s.photo ? "" : "bg-paper-2"}`}
        style={{ clipPath: clipPath(pts), containerType: "size" }}
      >
        {s.photo ? (
          <PhotoImg fill={s.photo} />
        ) : (
          <span className="pointer-events-none absolute inset-0 grid place-items-center p-1 text-center">
            <span>
              <span className="block rounded-full bg-white px-[0.7em] py-[0.3em] font-bold leading-none text-ink shadow" style={{ fontSize: "clamp(9px, 9cqmin, 14px)" }}>
                ＋ Add photo
              </span>
              <span className="mt-1 block text-ink-soft" style={{ fontSize: "clamp(8px, 6cqmin, 12px)" }}>
                {cm(mm.w)} × {cm(mm.h)} cm
              </span>
            </span>
          </span>
        )}
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polygon
          points={svgPoints(pts)}
          fill="none"
          className={selected ? "stroke-accent" : s.photo ? "stroke-transparent" : "stroke-ink/40"}
          strokeWidth={selected ? 2 : 1.25}
          strokeDasharray={selected || s.photo ? undefined : "4 3"}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

const ICON_MM: Partial<Record<ShapeKind, [number, number]>> = { rect: [26, 20], rounded: [26, 20], arch: [20, 26] };

function ShapeIcon({ kind, small = false }: { kind: ShapeKind; small?: boolean }) {
  const [w, h] = ICON_MM[kind] ?? [24, 24];
  const k = small ? 0.75 : 1;
  if (kind === "free") {
    return (
      <svg width={24 * k} height={24 * k} viewBox="0 0 100 100" aria-hidden>
        <path d="M22 72 C4 44 28 8 56 20 S98 42 82 70 S40 96 22 72 Z" fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={7} strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={w * k} height={h * k} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polygon points={svgPoints(outlineMm(kind, w, h))} fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
