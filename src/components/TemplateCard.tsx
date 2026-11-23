import Link from "next/link";
import type { Template } from "@/lib/data";
import { PRICING, formatRM } from "@/lib/data";
import { TemplatePreview } from "./TemplatePreview";

const difficultyColor: Record<Template["difficulty"], string> = {
  Easy: "bg-sage/20 text-[#3f5e41]",
  Medium: "bg-mustard/25 text-[#7a5a12]",
  Detailed: "bg-accent/15 text-accent",
};

export function TemplateCard({ template }: { template: Template }) {
  return (
    <article className="group relative flex flex-col rounded-xl border border-line bg-card p-2 transition-shadow hover:shadow-md sm:p-3">
      <TemplatePreview template={template} className="transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-[1.02]" />
      <div className="flex flex-1 flex-col px-1 pt-2.5 sm:pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-tight sm:text-lg">
            {/* the whole card is clickable via this link's ::after */}
            <Link href={`/book?template=${template.id}`} className="after:absolute after:inset-0 after:content-['']">
              {template.name}
            </Link>
          </h3>
          <span className="shrink-0 text-sm font-bold">{formatRM(PRICING.perPage)}</span>
        </div>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-soft sm:text-xs">{template.category}</p>
        <div className="mt-2 flex flex-wrap gap-1 text-[11px] sm:gap-1.5 sm:text-xs">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${difficultyColor[template.difficulty]}`}>
            {template.difficulty}
          </span>
          <span className="rounded-full bg-paper-2 px-2 py-0.5">~{template.minutes} min</span>
          <span className="hidden rounded-full bg-paper-2 px-2 py-0.5 sm:inline">
            {template.photos} photo{template.photos === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-2 hidden text-sm text-ink-soft sm:block">{template.features.join(" · ")}</p>
        <span className="mt-auto pt-2 text-sm font-semibold text-accent group-hover:underline sm:pt-3">
          Add to my session →
        </span>
      </div>
    </article>
  );
}
