import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getElements } from "@/lib/store";
import { PageBuilder } from "./PageBuilder";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Start your booking: pick ready-made scrapbook pages or design your own with drag and drop.",
};

async function Builder() {
  await connection();
  let elements: Awaited<ReturnType<typeof getElements>> = [];
  let unavailable = false;
  try {
    elements = await getElements();
  } catch (e) {
    console.error(e);
    unavailable = true;
  }
  return <PageBuilder elements={elements} elementsUnavailable={unavailable} />;
}

export default function PagesStep() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading pages…</p>}>
      <Builder />
    </Suspense>
  );
}
