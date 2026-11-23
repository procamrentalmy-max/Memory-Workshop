import Link from "next/link";

/**
 * Bar at the bottom of each booking step: running total, Back, and the next action.
 * Sticky by default; pass sticky={false} where it would cover something you work on (the page editor).
 */
export function ActionBar({ summary, back, children, sticky = true }: {
  summary: React.ReactNode; back?: string; children: React.ReactNode; sticky?: boolean;
}) {
  return (
    <div className={`${sticky ? "sticky bottom-3 z-30" : ""} mt-8 flex items-center justify-between gap-3 rounded-2xl bg-ink py-3 pl-4 pr-3 text-paper shadow-xl sm:py-4 sm:pl-6 sm:pr-4`}>
      <div className="min-w-0 text-sm leading-snug">{summary}</div>
      <div className="flex shrink-0 items-center gap-2">
        {back && (
          <Link href={back} aria-label="Back" className="grid h-11 min-w-11 place-items-center rounded-full border border-paper/30 px-3 font-semibold hover:bg-paper/10 sm:px-5">
            <span>← <span className="hidden sm:inline">Back</span></span>
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}

export const nextBtn = "btn bg-paper !px-5 !py-2.5 text-ink hover:bg-white disabled:opacity-50";
