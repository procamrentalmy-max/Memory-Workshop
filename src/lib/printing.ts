// Print layout of photo pages (photo collage and photo shapes), shared by the editors, the worker page
// and the print PDF. All sizes are in mm from the page's top-left corner.
import { layout, sheetMm, type Orientation } from "./collage";
import { shapeOutline, type Pt } from "./shapes";
import type { OrderPage, PhotoFill } from "./types";

/** One photo area on the sheet. `outline` is the shape (in % of the area); null means the whole rectangle. */
export type PrintRegion = { x: number; y: number; w: number; h: number; outline: Pt[] | null; photo?: PhotoFill };
export type PrintSheet = { orientation: Orientation; wMm: number; hMm: number; regions: PrintRegion[] };

/** The printable layout of a photo collage / photo shapes page, or null for other kinds of page. */
export function printSheet(page: OrderPage): PrintSheet | null {
  if (page.kind !== "collage" && page.kind !== "shapes") return null;
  const orientation = page.kind === "collage" ? page.collage.orientation : page.sheet.orientation;
  const s = sheetMm(orientation);
  const mm = (r: { x: number; y: number; w: number; h: number }) => ({ x: (r.x / 100) * s.w, y: (r.y / 100) * s.h, w: (r.w / 100) * s.w, h: (r.h / 100) * s.h });
  const regions: PrintRegion[] =
    page.kind === "collage"
      ? layout(page.collage.root).leaves.map(({ node, rect }) => ({ ...mm(rect), outline: null, photo: node.photo }))
      : page.sheet.shapes.map((sh) => ({ ...mm(sh), outline: shapeOutline(sh, orientation), photo: sh.photo }));
  return { orientation, wMm: s.w, hMm: s.h, regions };
}

/** Where a photo sits in a frame `w` × `h` (same units), exactly as PhotoImg draws it: covering the frame, zoomed and moved. */
export function photoPlacement(f: PhotoFill, w: number, h: number) {
  const r = f.w / f.h;
  const width = Math.max(w, h * r) * f.zoom;
  const height = width / r;
  return { left: ((w - width) * f.x) / 100, top: ((h - height) * f.y) / 100, width, height };
}

/** How sharp a photo prints in a frame `wMm` × `hMm`, in dots per inch. */
export const photoDpi = (f: PhotoFill, wMm: number, hMm: number) => Math.round(f.w / (photoPlacement(f, wMm, hMm).width / 25.4));

/** Plain-words print quality: 220 dpi and up looks sharp in the hand, under 150 can look soft. */
export const dpiQuality = (dpi: number) => (dpi >= 220 ? "Sharp" : dpi >= 150 ? "Good" : "Low");
