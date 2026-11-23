import { collagePhotos } from "./collage";
import type { Order } from "./types";

/** Every customer photo file used in an order, in page order. */
export function orderPhotoFiles(order: Order): string[] {
  return order.pages.flatMap((p) =>
    p.kind === "preset"
      ? Object.entries(p.photos ?? {}).sort(([a], [b]) => Number(a) - Number(b)).map(([, f]) => f.file)
      : p.kind === "collage"
        ? collagePhotos(p.collage.root).map((f) => f.file)
        : p.items.flatMap((it) => (it.type === "image" && it.photo ? [it.photo.file] : [])),
  );
}
