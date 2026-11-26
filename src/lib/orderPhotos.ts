import { collagePhotos } from "./collage";
import { sheetPhotos } from "./shapes";
import type { Order } from "./types";

/** Every customer photo file used in an order, in page order. */
export function orderPhotoFiles(order: Order): string[] {
  return order.pages.flatMap((p) =>
    p.kind === "collage" ? collagePhotos(p.collage.root).map((f) => f.file) : sheetPhotos(p.sheet).map((f) => f.file),
  );
}
