"use client";

export function PrintCardButton({ label = "Print the counter card" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-ghost !py-2 text-sm print:hidden">
      {label}
    </button>
  );
}
