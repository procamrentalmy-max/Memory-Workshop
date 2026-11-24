"use client";

import { useState } from "react";
import type { OrderPage } from "@/lib/types";
import { buildPrintPdf, downloadFile } from "./printPdf";

/** Downloads the print file (PDF) for one or more photo pages of an order. */
export function PrintButton({ pages, fileName, label, primary = false }: { pages: OrderPage[]; fileName: string; label: string; primary?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      downloadFile(await buildPrintPdf(pages, fileName.replace(/\.pdf$/, "")), fileName);
    } catch (e) {
      setError((e as Error).message || "Couldn't make the print file.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={run} disabled={busy}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${primary ? "bg-ink text-paper" : "border border-line bg-white hover:border-ink"}`}>
        {busy ? "Preparing PDF…" : label}
      </button>
      {error && <span className="mt-1 text-xs font-semibold text-accent" role="alert">{error}</span>}
    </span>
  );
}
