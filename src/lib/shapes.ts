// Photo shapes: customers draw shapes (circle, heart, star, their own outline…) on a blank A4 sheet,
// and each shape holds one photo cropped to it. Positions and sizes are % of the page.
import { sheetMm, type Orientation } from "./collage";
import type { PhotoFill } from "./types";

export type ShapeKind = "rect" | "rounded" | "circle" | "heart" | "star" | "hexagon" | "arch" | "flower" | "free";

export const SHAPE_KINDS: { kind: ShapeKind; label: string }[] = [
  { kind: "rect", label: "Rectangle" },
  { kind: "rounded", label: "Rounded" },
  { kind: "circle", label: "Circle" },
  { kind: "heart", label: "Heart" },
  { kind: "star", label: "Star" },
  { kind: "hexagon", label: "Hexagon" },
  { kind: "arch", label: "Arch" },
  { kind: "flower", label: "Flower" },
  { kind: "free", label: "Draw your own" },
];
export const SHAPE_KIND_IDS = SHAPE_KINDS.map((s) => s.kind);

/** A point as % of the shape's own box (0–100). */
export type Pt = [number, number];

export type PhotoShape = {
  id: string;
  kind: ShapeKind;
  x: number; // % of the page
  y: number;
  w: number;
  h: number;
  points?: Pt[]; // "free" shapes only: the outline the customer drew, as % of the shape's box
  photo?: PhotoFill;
};

export type ShapeSheet = { orientation: Orientation; shapes: PhotoShape[] };

export const MIN_SHAPE_MM = 15;
export const MAX_SHAPES = 30;
export const MAX_FREE_POINTS = 160;

/** Shape size on the printed page, in mm. */
export const shapeMm = (s: { w: number; h: number }, o: Orientation) => {
  const sheet = sheetMm(o);
  return { w: (s.w / 100) * sheet.w, h: (s.h / 100) * sheet.h };
};

/** Smallest shape size as % of the page. */
export const minShapePct = (o: Orientation) => {
  const sheet = sheetMm(o);
  return { w: (MIN_SHAPE_MM / sheet.w) * 100, h: (MIN_SHAPE_MM / sheet.h) * 100 };
};

/** Scales any outline so it exactly fills a 0–100 box. */
function fitBox(pts: Pt[]): Pt[] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return pts.map(([x, y]) => [((x - x0) / (x1 - x0 || 1)) * 100, ((y - y0) / (y1 - y0 || 1)) * 100]);
}

const around = (n: number, f: (t: number) => Pt): Pt[] => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2));

// Outlines that don't depend on the shape's proportions are worked out once.
const FIXED: Partial<Record<ShapeKind, Pt[]>> = {
  rect: [[0, 0], [100, 0], [100, 100], [0, 100]],
  circle: fitBox(around(72, (t) => [Math.cos(t), Math.sin(t)])),
  heart: fitBox(around(90, (t) => [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))])),
  star: fitBox(around(10, (t) => {
    const r = Math.round((t / (Math.PI * 2)) * 10) % 2 === 0 ? 1 : 0.48;
    return [r * Math.cos(t - Math.PI / 2), r * Math.sin(t - Math.PI / 2)];
  })),
  flower: fitBox(around(120, (t) => {
    const r = 0.84 + 0.16 * Math.cos(8 * t);
    return [r * Math.cos(t), r * Math.sin(t)];
  })),
};

/** The outline of a shape `w` × `h` mm in size, as points in % of its box. */
export function outlineMm(kind: ShapeKind, w: number, h: number, points?: Pt[]): Pt[] {
  const fixed = FIXED[kind];
  if (fixed) return fixed;
  switch (kind) {
    case "rounded": {
      const r = Math.min(w, h) * 0.2;
      const corner = (cx: number, cy: number, a0: number): Pt[] =>
        Array.from({ length: 9 }, (_, i) => {
          const a = a0 + (i / 8) * (Math.PI / 2);
          return [((cx + r * Math.cos(a)) / w) * 100, ((cy + r * Math.sin(a)) / h) * 100];
        });
      return [...corner(w - r, r, -Math.PI / 2), ...corner(w - r, h - r, 0), ...corner(r, h - r, Math.PI / 2), ...corner(r, r, Math.PI)];
    }
    case "arch": {
      const ry = (Math.min(w / 2, h) / h) * 100; // round top: a semicircle when the shape is tall enough
      const top: Pt[] = Array.from({ length: 33 }, (_, i) => {
        const a = Math.PI + (i / 32) * Math.PI;
        return [50 + 50 * Math.cos(a), ry + ry * Math.sin(a)];
      });
      return [...top, [100, 100], [0, 100]];
    }
    case "hexagon": {
      const inset = Math.min(50, (((h / 2) * Math.tan(Math.PI / 6)) / w) * 100); // regular when proportions allow
      return [[0, 50], [inset, 0], [100 - inset, 0], [100, 50], [100 - inset, 100], [inset, 100]];
    }
    case "free":
      return points && points.length >= 3 ? points : FIXED.rect!;
    default:
      return FIXED.rect!;
  }
}

/**
 * The outline of a shape on the page, as points in % of its box. Rounded corners, arches and hexagons
 * use the real printed size so they never look squashed.
 */
export function shapeOutline(s: Pick<PhotoShape, "kind" | "w" | "h" | "points">, o: Orientation): Pt[] {
  const { w, h } = shapeMm(s, o);
  return outlineMm(s.kind, w, h, s.points);
}

/** Size (mm) of a shape dropped onto the page with a tap. */
export const defaultShapeMm = (kind: ShapeKind): [number, number] =>
  kind === "rect" || kind === "rounded" ? [80, 60] : kind === "arch" ? [60, 80] : [70, 70];

/** CSS clip-path for an outline (scales with the element). */
export const clipPath = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ")})`;
/** SVG points attribute for an outline drawn in a 0 0 100 100 viewBox. */
export const svgPoints = (pts: Pt[]) => pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

/** Ramer–Douglas–Peucker line simplification. */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let worst = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const d = len ? Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len : Math.hypot(p[0] - a[0], p[1] - a[1]);
    if (d > worst) { worst = d; idx = i; }
  }
  if (worst <= eps) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}

/**
 * Turns a hand-drawn path (points in % of the page) into a closed "free" shape,
 * or null if it's too small to hold a photo.
 */
export function freeShapeFromPath(path: Pt[], o: Orientation): Omit<PhotoShape, "id"> | null {
  const sheet = sheetMm(o);
  const mm: Pt[] = path.map(([x, y]) => [(x / 100) * sheet.w, (y / 100) * sheet.h]);
  let eps = 0.6;
  let pts = simplify(mm, eps);
  while (pts.length > MAX_FREE_POINTS) pts = simplify(mm, (eps *= 1.5));
  if (pts.length > 3 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1) pts = pts.slice(0, -1);
  if (pts.length < 3) return null;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  if (x1 - x0 < MIN_SHAPE_MM || y1 - y0 < MIN_SHAPE_MM) return null;
  return {
    kind: "free",
    x: (x0 / sheet.w) * 100,
    y: (y0 / sheet.h) * 100,
    w: ((x1 - x0) / sheet.w) * 100,
    h: ((y1 - y0) / sheet.h) * 100,
    points: pts.map(([x, y]) => [((x - x0) / (x1 - x0)) * 100, ((y - y0) / (y1 - y0)) * 100]),
  };
}

/** Keeps a shape inside the page and at least the minimum size. */
export function fitOnPage<T extends { x: number; y: number; w: number; h: number }>(s: T, o: Orientation): T {
  const min = minShapePct(o);
  const w = Math.min(100, Math.max(min.w, s.w));
  const h = Math.min(100, Math.max(min.h, s.h));
  return { ...s, w, h, x: Math.min(100 - w, Math.max(0, s.x)), y: Math.min(100 - h, Math.max(0, s.y)) };
}

/**
 * Switching paper orientation keeps every shape's printed size (so circles stay round) and its place
 * on the page, shrinking a shape only if it no longer fits.
 */
export function reorient(shapes: PhotoShape[], from: Orientation, to: Orientation): PhotoShape[] {
  const a = sheetMm(from);
  const b = sheetMm(to);
  return shapes.map((s) => {
    let w = (s.w / 100) * a.w;
    let h = (s.h / 100) * a.h;
    const k = Math.min(1, b.w / w, b.h / h);
    w *= k;
    h *= k;
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const wp = (w / b.w) * 100;
    const hp = (h / b.h) * 100;
    return fitOnPage({ ...s, w: wp, h: hp, x: cx - wp / 2, y: cy - hp / 2 }, to);
  });
}

/**
 * Snapping for moving and resizing: the shape's edges or middle that are being moved line up with the
 * page edges, the middle of the page, and the edges and middles of other shapes, within about 3 mm.
 * `edges` are the positions being moved (% of the page); returns how far to shift and where the guide goes.
 */
export function snapEdges(edges: number[], targets: number[], axis: "x" | "y", o: Orientation) {
  const sheet = sheetMm(o);
  const threshold = (3 / (axis === "x" ? sheet.w : sheet.h)) * 100;
  let best: { delta: number; at: number } | null = null;
  for (const e of edges) {
    for (const t of targets) {
      const d = t - e;
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.delta))) best = { delta: d, at: t };
    }
  }
  return best;
}

/** Where other shapes (and the page) can be lined up with. */
export function snapTargets(shapes: PhotoShape[], exceptId: string | null) {
  const others = shapes.filter((s) => s.id !== exceptId);
  return {
    x: [0, 50, 100, ...others.flatMap((s) => [s.x, s.x + s.w / 2, s.x + s.w])],
    y: [0, 50, 100, ...others.flatMap((s) => [s.y, s.y + s.h / 2, s.y + s.h])],
  };
}

/** Photos on a shapes sheet, in drawing order. */
export const sheetPhotos = (sheet: ShapeSheet): PhotoFill[] => sheet.shapes.flatMap((s) => (s.photo ? [s.photo] : []));
