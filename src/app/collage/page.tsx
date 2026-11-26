import type { Metadata } from "next";
import { Suspense } from "react";
import { PRICING, formatRM } from "@/lib/data";
import { PhotoKeepAlive } from "../book/PhotoKeepAlive";
import { CollageEditor } from "./CollageEditor";

export const metadata: Metadata = {
  title: "Photo Collage",
  description: "Design an A4 photo page: split it into sections or draw your own shapes, add your photos, and we print it for your visit.",
};

export default function CollagePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <PhotoKeepAlive />
      <p className="font-hand text-2xl text-accent">design your photo prints</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Photo collage</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Your session includes <strong className="text-ink">two A5 photo prints</strong>: one A4 sheet per person. Split it in
        two (or into any layout), or draw shapes on a blank sheet: circles, hearts, stars or your own outline. Then fill
        each one with a photo cropped to fit. Extra sheets are {formatRM(PRICING.photoPrint)} per photo.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
          <CollageEditor />
        </Suspense>
      </div>
    </div>
  );
}
