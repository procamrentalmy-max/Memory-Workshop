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
  createdAt: string;
};

export const elementSrc = (file: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/elements/${encodeURIComponent(file)}`;

/** Items placed on a drag & drop page. Positions/sizes are % of the page so it scales on any screen. */
type Box = { id: string; x: number; y: number; w: number; h: number };
export type ImageItem = Box & { type: "image"; elementId: string; file: string; name: string; price: number; aspect: number };
export type SectionItem = Box & { type: "section"; color: string };
export type TextItem = Box & { type: "text"; text: string; color: string; size: number; font: "hand" | "display" | "sans" };
export type CanvasItem = ImageItem | SectionItem | TextItem;

export type OrderPage =
  | { kind: "preset"; id: string; templateId: string }
  | { kind: "custom"; id: string; items: CanvasItem[]; background: string };

export type Order = {
  visit: { date: string; time: string; people: number } | null;
  pages: OrderPage[];
  drinks: Record<string, number>; // drink name -> quantity
};

export const EMPTY_ORDER: Order = { visit: null, pages: [], drinks: {} };
// The page is A4; its size lives in ./pageSize.ts.
