"use client";

import { photoPlacement, printSheet } from "@/lib/printing";
import type { Pt } from "@/lib/shapes";
import type { OrderPage } from "@/lib/types";

const PT_PER_MM = 72 / 25.4;
const FULL: Pt[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

/**
 * Builds a print-ready PDF: one exact-size A4 page per photo page. Each photo is the customer's original
 * JPEG, embedded as it is (never resized or recompressed), cut to its section or shape.
 */
export async function buildPrintPdf(pages: OrderPage[], title: string): Promise<Uint8Array> {
  const { PDFDocument, pushGraphicsState, popGraphicsState, moveTo, lineTo, closePath, clip, endPath } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreator("Memory studio worker page");

  type Embedded = Awaited<ReturnType<typeof pdf.embedJpg>>;
  const images = new Map<string, Promise<Embedded>>();
  const image = (file: string) => {
    if (!images.has(file)) {
      images.set(file, (async () => {
        const res = await fetch(`/api/photos/${file}`);
        if (!res.ok) throw new Error("A photo couldn't be loaded. It may already have been deleted.");
        return pdf.embedJpg(await res.arrayBuffer());
      })());
    }
    return images.get(file)!;
  };

  for (const p of pages) {
    const sheet = printSheet(p);
    if (!sheet) continue;
    const page = pdf.addPage([sheet.wMm * PT_PER_MM, sheet.hMm * PT_PER_MM]);
    // PDF measures from the bottom-left corner, in points.
    const at = (xMm: number, yMm: number): [number, number] => [xMm * PT_PER_MM, (sheet.hMm - yMm) * PT_PER_MM];
    for (const r of sheet.regions) {
      if (!r.photo) continue;
      const img = await image(r.photo.file);
      const outline = r.outline ?? FULL;
      const point = ([x, y]: Pt) => at(r.x + (x / 100) * r.w, r.y + (y / 100) * r.h);
      page.pushOperators(
        pushGraphicsState(),
        moveTo(...point(outline[0])),
        ...outline.slice(1).map((q) => lineTo(...point(q))),
        closePath(),
        clip(),
        endPath(),
      );
      const pl = photoPlacement(r.photo, r.w, r.h);
      const [x, y] = at(r.x + pl.left, r.y + pl.top + pl.height);
      page.drawImage(img, { x, y, width: pl.width * PT_PER_MM, height: pl.height * PT_PER_MM });
      page.pushOperators(popGraphicsState());
    }
  }
  return pdf.save();
}

export function downloadFile(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
