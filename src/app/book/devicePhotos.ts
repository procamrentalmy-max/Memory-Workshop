"use client";

import { useEffect } from "react";
import { collagePhotos, type CollageNode } from "@/lib/collage";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import type { PhotoShape } from "@/lib/shapes";
import { getOrder } from "./orderStore";
import { releasePhotos } from "./photos";

// Unfinished work kept in this browser.
export const COLLAGE_DRAFT_KEY = "pm-collage-v1"; // photo collage (split the page)
export const SHAPES_DRAFT_KEY = "pm-shapes-v1"; // photo shapes

function read<T>(key: string): T | null {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

/** Photos on the unfinished photo collage or photo shapes page. */
export function photoDraftFiles(mode: "split" | "shapes"): string[] {
  if (mode === "split") {
    const d = read<{ root?: CollageNode }>(COLLAGE_DRAFT_KEY);
    try {
      return d?.root ? collagePhotos(d.root).map((f) => f.file) : [];
    } catch {
      return [];
    }
  }
  const d = read<{ shapes?: PhotoShape[] }>(SHAPES_DRAFT_KEY);
  return Array.isArray(d?.shapes) ? d.shapes.flatMap((s) => (s?.photo?.file ? [s.photo.file] : [])) : [];
}

/** True if the customer has started a photo collage / photo shapes page that isn't in their order yet. */
export function photoDraftStarted(mode: "split" | "shapes"): boolean {
  if (mode === "split") {
    const root = read<{ root?: CollageNode }>(COLLAGE_DRAFT_KEY)?.root;
    return !!root && (root.kind === "split" || !!root.photo);
  }
  const shapes = read<{ shapes?: unknown[] }>(SHAPES_DRAFT_KEY)?.shapes;
  return Array.isArray(shapes) && shapes.length > 0;
}

/** Photos on all unsaved work in this browser: the photo collage and photo shapes pages. */
export function draftPhotoFiles(): string[] {
  return [...photoDraftFiles("split"), ...photoDraftFiles("shapes")];
}

/** Every photo this device still uses: its order and its unfinished pages. */
function photosInUse(): Set<string> {
  const used = new Set(draftPhotoFiles());
  try {
    orderPhotoFiles(getOrder()).forEach((f) => used.add(f));
  } catch { /* ignore */ }
  return used;
}

// Photos the photo collage / shapes editors have shown on this page; checked for clean-up at
// checkpoints (page added to the order, started over, or the browser tab closed).
const seenOnThisPage = new Set<string>();
export const notePhotos = (files: string[]) => files.forEach((f) => seenOnThisPage.add(f));

/** Deletes the photos this page has seen that nothing on this device uses any more. */
export function releaseUnusedPhotos({ beacon = false } = {}) {
  const used = photosInUse();
  const free = [...seenOnThisPage].filter((f) => !used.has(f));
  free.forEach((f) => seenOnThisPage.delete(f));
  releasePhotos(free, { beacon });
}

/** Throws away the unfinished photo collage / shapes page and deletes its photos. */
export function discardPhotoDraft(mode: "split" | "shapes") {
  notePhotos(photoDraftFiles(mode));
  try {
    window.localStorage.removeItem(mode === "split" ? COLLAGE_DRAFT_KEY : SHAPES_DRAFT_KEY);
  } catch { /* ignore */ }
  releaseUnusedPhotos();
}

/**
 * For the photo collage / shapes editors: photos a customer replaces or removes are kept while they can
 * still undo, then deleted when the page is added to the order, started over, or the browser tab is closed.
 */
export function usePhotoCleanup(current: string[]) {
  const key = current.join(",");
  useEffect(() => {
    if (key) notePhotos(key.split(","));
  }, [key]);
  useEffect(() => {
    const onHide = (e: PageTransitionEvent) => {
      if (!e.persisted) releaseUnusedPhotos({ beacon: true });
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);
}
