// Rebuilds customer data that comes from the browser using trusted values only (server side).
import { MAX_COLLAGE_NODES, type CollageNode, type Orientation } from "./collage";
import { MAX_FREE_POINTS, MAX_SHAPES, SHAPE_KIND_IDS, fitOnPage, type PhotoShape, type Pt, type ShapeKind } from "./shapes";
import { PHOTO_FILE_RE, type OrderPage, type PhotoFill } from "./types";

export const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** A customer photo placed in a frame, or null if it isn't valid. */
export function cleanFill(raw: unknown): PhotoFill | null {
  const f = raw as Partial<PhotoFill> | null;
  if (!f || typeof f.file !== "string" || !PHOTO_FILE_RE.test(f.file)) return null;
  // Full-size originals: up to 20000 px a side (the same limit as /api/photos/confirm).
  const w = Math.round(num(f.w, 0, 20000));
  const h = Math.round(num(f.h, 0, 20000));
  if (!w || !h) return null;
  return { file: f.file, w, h, zoom: num(f.zoom, 1, 4), x: num(f.x, 0, 100), y: num(f.y, 0, 100) };
}

/** Rebuilds a collage layout from trusted values only (bounded size and depth). */
function cleanCollageNode(raw: unknown, depth: number, budget: { count: number }): CollageNode | null {
  const n = raw as Record<string, unknown> | null;
  if (!n || typeof n !== "object" || depth > 10 || ++budget.count > MAX_COLLAGE_NODES) return null;
  const id = String(n.id ?? "").slice(0, 20) || "n";
  if (n.kind === "leaf") {
    const photo = cleanFill(n.photo);
    return { id, kind: "leaf", ...(photo ? { photo } : {}) };
  }
  if (n.kind === "split" && (n.dir === "v" || n.dir === "h")) {
    const a = cleanCollageNode(n.a, depth + 1, budget);
    const b = cleanCollageNode(n.b, depth + 1, budget);
    if (!a || !b) return null;
    return { id, kind: "split", dir: n.dir, at: num(n.at, 3, 97), a, b };
  }
  return null;
}

/** Rebuilds the shapes on a photo shapes sheet; shapes without a photo aren't printed, so they're dropped. */
function cleanShapes(raw: unknown, orientation: Orientation): PhotoShape[] {
  const out: PhotoShape[] = [];
  for (const r of Array.isArray(raw) ? raw.slice(0, MAX_SHAPES) : []) {
    const s = r as Record<string, unknown> | null;
    const photo = cleanFill(s?.photo);
    if (!s || !photo || !SHAPE_KIND_IDS.includes(s.kind as ShapeKind)) continue;
    const kind = s.kind as ShapeKind;
    let points: Pt[] | undefined;
    if (kind === "free") {
      const pts = Array.isArray(s.points) ? s.points.slice(0, MAX_FREE_POINTS) : [];
      points = pts.filter((p): p is [unknown, unknown] => Array.isArray(p) && p.length === 2).map(([x, y]) => [num(x, 0, 100), num(y, 0, 100)] as Pt);
      if (points.length < 3) continue;
    }
    const box = fitOnPage({ x: num(s.x, 0, 100), y: num(s.y, 0, 100), w: num(s.w, 0, 100), h: num(s.h, 0, 100) }, orientation);
    out.push({ id: String(s.id ?? "").slice(0, 20) || "s", kind, ...box, ...(points ? { points } : {}), photo });
  }
  return out;
}

/** A photo collage or photo shapes page, rebuilt from trusted values; null if it isn't valid or has no photos. */
export function cleanPhotoPage(raw: unknown, id: string): OrderPage | null {
  const p = raw as { kind?: unknown; collage?: { orientation?: unknown; root?: unknown }; sheet?: { orientation?: unknown; shapes?: unknown } } | null;
  if (p?.kind === "collage") {
    const root = cleanCollageNode(p.collage?.root, 0, { count: 0 });
    const orientation = p.collage?.orientation === "landscape" ? "landscape" : "portrait";
    return root ? { kind: "collage", id, collage: { orientation, root } } : null;
  }
  if (p?.kind === "shapes") {
    const orientation = p.sheet?.orientation === "landscape" ? "landscape" : "portrait";
    const shapes = cleanShapes(p.sheet?.shapes, orientation);
    return shapes.length ? { kind: "shapes", id, sheet: { orientation, shapes } } : null;
  }
  return null;
}
