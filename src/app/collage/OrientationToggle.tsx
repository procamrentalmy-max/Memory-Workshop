import { sheetMm, type Orientation } from "@/lib/collage";

/** Portrait / landscape switch for an A4 sheet. */
export function OrientationToggle({ value, onChange }: { value: Orientation; onChange: (o: Orientation) => void }) {
  const sheet = sheetMm(value);
  return (
    <div>
      <h2 className="text-sm font-semibold">Paper</h2>
      <div className="mt-2 flex rounded-full border border-line p-1" role="group" aria-label="Orientation">
        {(["portrait", "landscape"] as const).map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${value === o ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>
            <span className={`inline-block border-2 border-current ${o === "portrait" ? "h-4 w-3" : "h-3 w-4"}`} aria-hidden />
            {o === "portrait" ? "Portrait" : "Landscape"}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-soft">A4 · {sheet.w / 10} × {sheet.h / 10} cm</p>
    </div>
  );
}
