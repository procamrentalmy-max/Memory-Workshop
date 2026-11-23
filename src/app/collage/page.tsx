import type { Metadata } from "next";
import { Suspense } from "react";
import { PRICING, formatRM } from "@/lib/data";
import { PhotoKeepAlive } from "../book/PhotoKeepAlive";
import { CollageEditor } from "./CollageEditor";

export const metadata: Metadata = {
  title: "Photo Collage",
  description: "Design an A4 photo collage: split the page your way, add your photos, and we print it for your visit.",
};

export default function CollagePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <PhotoKeepAlive />
      <p className="font-hand text-2xl text-accent">print your photos</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Photo collage</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Split an A4 sheet however you like (two A5 halves, a grid, or your own layout), then fill each section with a photo
        cropped to fit. {formatRM(PRICING.collagePage)} per printed sheet.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
          <CollageEditor />
        </Suspense>
      </div>
    </div>
  );
}
