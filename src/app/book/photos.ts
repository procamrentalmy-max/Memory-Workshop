"use client";

import { rememberLocalPhoto } from "@/components/PhotoImg";
import { readJpegInfo } from "@/lib/jpeg";
import { MAX_PHOTO_BYTES, type PhotoFill } from "@/lib/types";

const MAX_PIXELS = 16_000_000; // the largest picture phones can redraw (iPhone canvas limit)

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Turns a photo that can't be used as it is (PNG/HEIC/WebP, or a JPEG the phone stored sideways)
 * into an upright full-resolution JPEG.
 */
async function convertPhoto(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This photo couldn't be opened. Please choose a JPG or PNG photo.");
  }
  const s = Math.min(1, Math.sqrt(MAX_PIXELS / (bmp.width * bmp.height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  for (const q of [0.95, 0.9, 0.85]) {
    const blob = await toBlob(canvas, q);
    if (blob && blob.size <= MAX_PHOTO_BYTES) return { blob, w: canvas.width, h: canvas.height };
  }
  throw new Error("That photo is too large. Please try another one.");
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed. Please try again.");
  return json;
}

/**
 * Uploads a photo at full size so the studio can print it as sharp as possible. An upright JPEG
 * (most phone photos) is sent exactly as it is; anything else is converted to JPEG at full resolution.
 * Returns it centred in the frame.
 */
export async function uploadPhoto(file: File): Promise<PhotoFill> {
  if (file.type && !file.type.startsWith("image/")) throw new Error("Please choose a photo.");
  const info = readJpegInfo(new Uint8Array(await file.slice(0, 512 * 1024).arrayBuffer()));
  const { blob, w, h } =
    info && info.orientation === 1 && file.size <= MAX_PHOTO_BYTES
      ? { blob: file as Blob, w: info.width, h: info.height }
      : await convertPhoto(file);

  const { file: name, uploadUrl } = await postJson("/api/photos/upload-url", { bytes: blob.size });
  const put = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg", "x-upsert": "false" } }).catch(() => null);
  if (!put?.ok) throw new Error("Upload failed. Please check your connection and try again.");
  await postJson("/api/photos/confirm", { file: name, w, h });
  rememberLocalPhoto(name, URL.createObjectURL(blob));
  return { file: name, w, h, zoom: 1, x: 50, y: 50 };
}

/**
 * Deletes photos this browser no longer uses, straight away. The server never deletes a photo that is
 * part of a booking. `beacon` sends it even while the page is closing.
 */
export function releasePhotos(files: string[], { beacon = false } = {}) {
  const unique = [...new Set(files)];
  if (unique.length === 0) return;
  const body = JSON.stringify({ files: unique });
  if (beacon && navigator.sendBeacon?.("/api/photos/release", new Blob([body], { type: "application/json" }))) return;
  fetch("/api/photos/release", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}
