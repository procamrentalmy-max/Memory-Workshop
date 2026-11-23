// Photo collage on an A4 sheet. The sheet is divided by straight lines; every line runs edge to edge
// of the section it splits (it touches the surrounding lines and never crosses another line), so the
// layout is a tree of splits. Positions are % of the parent section, so layouts survive orientation changes.
import type { PhotoFill } from "./types";

export type Orientation = "portrait" | "landscape";

export type CollageNode =
  | { id: string; kind: "leaf"; photo?: PhotoFill }
  // dir "v": a vertical line splitting left (a) | right (b); dir "h": a horizontal line splitting top (a) / bottom (b).
  // `at` is where the line sits, as % of this section's width ("v") or height ("h").
  | { id: string; kind: "split"; dir: "v" | "h"; at: number; a: CollageNode; b: CollageNode };

export type Collage = { orientation: Orientation; root: CollageNode };

/** Page size in mm. */
export const sheetMm = (o: Orientation) => (o === "portrait" ? { w: 210, h: 297 } : { w: 297, h: 210 });

/** Smallest allowed section side, in mm. */
export const MIN_SECTION_MM = 15;

export type Rect = { x: number; y: number; w: number; h: number }; // % of the page
export type LeafBox = { node: Extract<CollageNode, { kind: "leaf" }>; rect: Rect };
export type LineBox = { node: Extract<CollageNode, { kind: "split" }>; box: Rect; pos: number }; // pos: % of page along the split axis

/** Positions of every section and line on the page (in % of the page). */
export function layout(root: CollageNode) {
  const leaves: LeafBox[] = [];
  const lines: LineBox[] = [];
  const walk = (n: CollageNode, r: Rect) => {
    if (n.kind === "leaf") return void leaves.push({ node: n, rect: r });
    if (n.dir === "v") {
      const w1 = (r.w * n.at) / 100;
      lines.push({ node: n, box: r, pos: r.x + w1 });
      walk(n.a, { x: r.x, y: r.y, w: w1, h: r.h });
      walk(n.b, { x: r.x + w1, y: r.y, w: r.w - w1, h: r.h });
    } else {
      const h1 = (r.h * n.at) / 100;
      lines.push({ node: n, box: r, pos: r.y + h1 });
      walk(n.a, { x: r.x, y: r.y, w: r.w, h: h1 });
      walk(n.b, { x: r.x, y: r.y + h1, w: r.w, h: r.h - h1 });
    }
  };
  walk(root, { x: 0, y: 0, w: 100, h: 100 });
  return { leaves, lines };
}

/** Width ÷ height of a section on the printed page. */
export const rectAspect = (r: Rect, o: Orientation) => {
  const s = sheetMm(o);
  return (r.w * s.w) / (r.h * s.h);
};

/** True if every section is at least MIN_SECTION_MM on each side. */
export function fitsMinimum(root: CollageNode, o: Orientation) {
  const s = sheetMm(o);
  return layout(root).leaves.every(({ rect }) => (rect.w / 100) * s.w >= MIN_SECTION_MM - 0.01 && (rect.h / 100) * s.h >= MIN_SECTION_MM - 0.01);
}

/**
 * Snaps a line position (% of page along its axis) to: the middle and thirds of the section it splits,
 * and other lines running the same way. Returns the snapped position and what it snapped to.
 */
export function snapLine(pos: number, dir: "v" | "h", box: Rect, otherLines: LineBox[], o: Orientation) {
  const s = sheetMm(o);
  const span = dir === "v" ? box.w : box.h;
  const start = dir === "v" ? box.x : box.y;
  const threshold = (6 / (dir === "v" ? s.w : s.h)) * 100; // within about 6 mm (easy to hit with a finger)
  const targets: { at: number; kind: "half" | "third" | "line" }[] = [
    { at: start + span / 2, kind: "half" },
    { at: start + span / 3, kind: "third" },
    { at: start + (span * 2) / 3, kind: "third" },
    ...otherLines.filter((l) => l.node.dir === dir).map((l) => ({ at: l.pos, kind: "line" as const })),
  ];
  let best: (typeof targets)[number] | null = null;
  for (const t of targets) {
    if (Math.abs(t.at - pos) <= threshold && (!best || Math.abs(t.at - pos) < Math.abs(best.at - pos))) best = t;
  }
  return best ? { pos: best.at, snapped: best.kind } : { pos, snapped: null };
}

/** Immutable update of one node in the tree. */
export function replaceNode(root: CollageNode, id: string, fn: (n: CollageNode) => CollageNode): CollageNode {
  if (root.id === id) return fn(root);
  if (root.kind === "split") {
    const a = replaceNode(root.a, id, fn);
    const b = replaceNode(root.b, id, fn);
    return a === root.a && b === root.b ? root : { ...root, a, b };
  }
  return root;
}

export const newNodeId = () => Math.random().toString(36).slice(2, 10);
const leaf = (): CollageNode => ({ id: newNodeId(), kind: "leaf" });
const split = (dir: "v" | "h", at: number, a: CollageNode, b: CollageNode): CollageNode => ({ id: newNodeId(), kind: "split", dir, at, a, b });

/** Ready-made layouts. "Halves" etc. follow the page's long side, so 2 × A5 works in both orientations. */
export function presetLayout(name: "full" | "a5" | "a6" | "strips" | "feature", o: Orientation): CollageNode {
  const long = o === "portrait" ? "h" : "v"; // a line across the long side halves the A4 into A5s
  const short = long === "h" ? "v" : "h";
  switch (name) {
    case "full": return leaf();
    case "a5": return split(long, 50, leaf(), leaf());
    case "a6": return split(long, 50, split(short, 50, leaf(), leaf()), split(short, 50, leaf(), leaf()));
    case "strips": return split(long, 100 / 3, leaf(), split(long, 50, leaf(), leaf()));
    case "feature": return split(long, 62, leaf(), split(short, 50, leaf(), leaf()));
  }
}

/** All photos in a collage, in reading order. */
export function collagePhotos(root: CollageNode): PhotoFill[] {
  return layout(root).leaves.flatMap((l) => (l.node.photo ? [l.node.photo] : []));
}

export const MAX_COLLAGE_NODES = 63; // up to 32 sections
