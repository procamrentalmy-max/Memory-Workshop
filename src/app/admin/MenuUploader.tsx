"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/** Upload, replace or remove the café menu PDF shown on the shop page. */
export function MenuUploader({ hasMenu }: { hasMenu: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf") return setError("Please choose a PDF file.");
    if (file.size > 4.4 * 1024 * 1024) return setError("The PDF must be under 4.4 MB. Try exporting it with a smaller file size.");
    setBusy(true);
    const data = new FormData();
    data.set("file", file);
    const res = await fetch("/api/admin/menu", { method: "POST", body: data });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Upload failed.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remove the café menu? The shop page will show the drinks list instead.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/menu", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Could not remove the menu.");
    router.refresh();
  }

  return (
    <div>
      <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} aria-label="Café menu PDF" />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn btn-primary disabled:opacity-60">
          {busy ? "Working…" : hasMenu ? "Replace menu PDF" : "Upload menu PDF"}
        </button>
        {hasMenu && (
          <button type="button" disabled={busy} onClick={remove} className="btn btn-ghost disabled:opacity-60">Remove menu</button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-accent" role="alert">{error}</p>}
    </div>
  );
}
