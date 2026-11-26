import type { Collage } from "./collage";
import type { ShapeSheet } from "./shapes";

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

/** A photo page: one printed A4 sheet. */
export type OrderPage =
  | { kind: "collage"; id: string; collage: Collage } // an A4 sheet split into photo sections (see lib/collage.ts)
  | { kind: "shapes"; id: string; sheet: ShapeSheet }; // photos in shapes drawn on a blank A4 (see lib/shapes.ts)

export type Order = {
  packages?: Record<string, number>; // package id -> how many people take it
  visit: { date: string; time: string; people: number } | null;
  pages: OrderPage[];
  drinks: Record<string, number>; // drink name -> quantity
};

export const EMPTY_ORDER: Order = { packages: {}, visit: null, pages: [], drinks: {} };

/** Largest photo a customer can upload (must match the "customer-photos" bucket's file size limit). */
export const MAX_PHOTO_BYTES = 30 * 1024 * 1024;

/** Stored customer photo names look like "<uuid>.jpg". */
export const PHOTO_FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
