import type { Collage } from "./collage";
import type { ShapeSheet } from "./shapes";

/** A rectangle as % of its container: { x, y, w, h }. */
export type Rect = { x: number; y: number; w: number; h: number };

/** An image element uploaded by the admin, placed on the A4 page at its printed size. */
export type Element = {
  id: string;
  name: string;
  price: number; // RM
  file: string; // path in the Supabase "elements" storage bucket
  width: number; // image pixel size (gives its proportions)
  height: number;
  widthCm: number; // printed size on the page, entered by the admin
  heightCm: number;
  /** Photo frames only: where the customer's photo goes, as % of the element image. */
  photoWindow: Rect | null;
  createdAt: string;
};

export const elementSrc = (file: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/elements/${encodeURIComponent(file)}`;

/** Public link to a website file such as the café menu PDF. */
export const siteFileSrc = (file: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-files/${encodeURIComponent(file)}`;

/** The café menu PDF currently shown on the shop page. */
export type CafeMenu = { file: string; uploadedAt: string };

/**
 * A customer's photo placed in a frame. The photo always covers the frame;
 * `zoom` (1 = just covers) crops in, and `x`/`y` (0–100) choose which part shows.
 */
export type PhotoFill = {
  file: string; // stored name, served from /api/photos/<file>
  w: number; // photo pixel size
  h: number;
  zoom: number;
  x: number;
  y: number;
};

/** Items placed on a drag & drop page. Positions/sizes are % of the page so it scales on any screen. */
type Box = { id: string; x: number; y: number; w: number; h: number };
export type ImageItem = Box & {
  type: "image"; elementId: string; file: string; name: string; price: number; aspect: number;
  window?: Rect; // set when the element is a photo frame
  photo?: PhotoFill;
};
export type SectionItem = Box & { type: "section"; color: string };
export type TextItem = Box & { type: "text"; text: string; color: string; size: number; font: "hand" | "display" | "sans" };
export type CanvasItem = ImageItem | SectionItem | TextItem;

export type OrderPage =
  | { kind: "preset"; id: string; templateId: string; photos?: Record<string, PhotoFill> } // photos keyed by frame number
  | { kind: "custom"; id: string; items: CanvasItem[]; background: string }
  | { kind: "collage"; id: string; collage: Collage } // an A4 sheet split into photo sections (see lib/collage.ts)
  | { kind: "shapes"; id: string; sheet: ShapeSheet }; // photos in shapes drawn on a blank A4 (see lib/shapes.ts)

export type Order = {
  visit: { date: string; time: string; people: number } | null;
  pages: OrderPage[];
  drinks: Record<string, number>; // drink name -> quantity
};

export const EMPTY_ORDER: Order = { visit: null, pages: [], drinks: {} };
// The page is A4; its size lives in ./pageSize.ts.

/** Stored customer photo names look like "<uuid>.jpg". */
export const PHOTO_FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
