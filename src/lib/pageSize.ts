// The printed scrapbook page is A4. Each uploaded element has a printed size in cm, entered by the
// admin, and is placed on the page at exactly that size. Customers can't resize elements.

export const PAGE = { widthCm: 21, heightCm: 29.7 } as const; // A4

/** Height ÷ width of the page (A4 ≈ 1.414). */
export const PAGE_RATIO = PAGE.heightCm / PAGE.widthCm;

/** Tailwind class giving any box the A4 shape. */
export const A4_ASPECT = "aspect-[210/297]";

/** Where an element of this printed size sits on the page, as % of the page's width and height. */
export function elementBox(widthCm: number, heightCm: number) {
  return { w: (widthCm / PAGE.widthCm) * 100, h: (heightCm / PAGE.heightCm) * 100 };
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

/** e.g. "5 × 6.7 cm" */
export const sizeLabel = (widthCm: number, heightCm: number) => `${fmt(widthCm)} × ${fmt(heightCm)} cm`;

export const fitsOnPage = (widthCm: number, heightCm: number) =>
  widthCm > 0 && heightCm > 0 && widthCm <= PAGE.widthCm + 1e-9 && heightCm <= PAGE.heightCm + 1e-9;

/** Height that keeps the image's own proportions for a chosen width (so it is never cropped or stretched). */
export const heightForWidth = (widthCm: number, px: { width: number; height: number }) =>
  Math.round(((widthCm * px.height) / px.width) * 100) / 100;

/** Print sharpness in dots per inch at this printed width. Below ~150 dpi photos start to look soft. */
export const printDpi = (widthPx: number, widthCm: number) => Math.round(widthPx / (widthCm / 2.54));
