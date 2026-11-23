import type { Metadata } from "next";
import { PRICING, TEMPLATES, formatRM } from "@/lib/data";
import { TemplateGallery } from "./TemplateGallery";

export const metadata: Metadata = {
  title: "Page Templates",
  description: "Browse professionally designed scrapbook pages for travel, couples, friends, family and celebrations.",
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <p className="font-hand text-2xl text-accent">pick your pages</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Page templates</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {TEMPLATES.length} professionally designed scrapbook pages, {formatRM(PRICING.perPage)} each. Every page
        comes with its printed materials, your photos (where required), cutting lines, folding guides and
        step-by-step instructions.
      </p>
      <TemplateGallery templates={TEMPLATES} />
    </div>
  );
}
