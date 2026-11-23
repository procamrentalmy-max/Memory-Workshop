"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

/** Deletes unused customer photos after a confirmation. The server re-checks which ones are safe to delete. */
export function PhotoCleanupButton({ count, bytes }: { count: number; bytes: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function clean() {
    if (!confirm(`Delete ${count} unused photo${count === 1 ? "" : "s"} (${mb(bytes)})? Photos in bookings are never deleted. This can't be undone.`)) return;
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/photos", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMessage(json.error ?? "Clean-up failed. Please try again.");
    setMessage(`Deleted ${json.deleted} photo${json.deleted === 1 ? "" : "s"} (${mb(json.bytes)}).`);
    router.refresh();
  }

  return (
    <div className="text-right">
      <button type="button" onClick={clean} disabled={busy || count === 0} className="btn btn-primary disabled:opacity-50">
        {busy ? "Cleaning up…" : count ? `Delete ${count} unused photo${count === 1 ? "" : "s"} (${mb(bytes)})` : "Nothing to clean up"}
      </button>
      {message && <p className="mt-2 text-sm" role="status">{message}</p>}
    </div>
  );
}
