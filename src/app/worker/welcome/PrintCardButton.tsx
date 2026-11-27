"use client";

export function PrintCardButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-ghost !py-2 text-sm">
      Print the counter card
    </button>
  );
}
