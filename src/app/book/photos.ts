"use client";

import { rememberLocalPhoto } from "@/components/PhotoImg";
import type { PhotoFill } from "@/lib/types";

const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024; // under the server's 4 MB limit

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Shrinks a photo from the gallery to at most 3000 px (still sharp on A4) and converts it to JPEG.
 * Also applies the phone's rotation, so sideways photos come out the right way up.
 */
async function preparePhoto(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This photo couldn't be opened. Please choose a JPG or PNG photo.");
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  for (const max of [3000, 2400, 1800]) {
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    canvas.width = Math.round(bmp.width * s);
    canvas.height = Math.round(bmp.height * s);
    ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    for (const q of [0.9, 0.82, 0.74]) {
      const blob = await toBlob(canvas, q);
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        bmp.close();
        return { blob, w: canvas.width, h: canvas.height };
      }
    }
  }
  bmp.close();
  throw new Error("That photo is too large. Please try another one.");
}

/** Prepares and uploads a photo; returns it centred in the frame. */
export async function uploadPhoto(file: File): Promise<PhotoFill> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a photo.");
  const { blob, w, h } = await preparePhoto(file);
  const data = new FormData();
  data.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
  data.set("w", String(w));
  data.set("h", String(h));
  const res = await fetch("/api/photos", { method: "POST", body: data });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.file) throw new Error(json.error ?? "Upload failed. Please try again.");
  rememberLocalPhoto(json.file, URL.createObjectURL(blob));
  return { file: json.file, w, h, zoom: 1, x: 50, y: 50 };
}
