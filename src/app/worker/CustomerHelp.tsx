"use client";

import { useState, useTransition } from "react";
import { makeSignInQr, searchCustomers, type FoundCustomer } from "./actions";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "numeric", minute: "2-digit" });

/** A customer forgot their password: find them, then show a one-time sign-in QR code for them to scan. */
export function CustomerHelp() {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<FoundCustomer[] | null>(null);
  const [qr, setQr] = useState<{ name: string; svg: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const search = () =>
    start(async () => {
      setError(null);
      setQr(null);
      try {
        setFound(await searchCustomers(query));
      } catch {
        setError("Couldn't search. Please try again.");
      }
    });

  return (
    <div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mobile number or name"
          aria-label="Mobile number or name"
          className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2"
        />
        <button type="submit" disabled={pending || query.trim().length < 2} className="btn btn-ghost !py-2 text-sm disabled:opacity-50">
          {pending && !qr ? "Searching…" : "Find"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      {found && !qr && (
        found.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No account found. If it&apos;s their first visit, show the welcome QR.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card text-sm">
            {found.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span><strong>{c.name}</strong> · {c.phone}</span>
                <button
                  type="button"
                  disabled={pending}
                  className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                  onClick={() =>
                    start(async () => {
                      try {
                        setQr(await makeSignInQr(c.id));
                      } catch {
                        setError("Couldn't make the QR code. Please try again.");
                      }
                    })
                  }
                >
                  Make sign-in QR
                </button>
              </li>
            ))}
          </ul>
        )
      )}
      {qr && (
        <div className="mt-4 flex flex-wrap items-start gap-5 rounded-xl border border-mustard bg-card p-4">
          <div className="w-48 shrink-0 [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label={`Sign-in QR code for ${qr.name}`} dangerouslySetInnerHTML={{ __html: qr.svg }} />
          <div className="text-sm">
            <p className="font-semibold">Sign-in QR for {qr.name}</p>
            <p className="mt-1 text-ink-soft">
              Check it&apos;s really them, then ask them to scan it with their phone camera. It logs them in and asks for a new
              password. Works once, until {time(qr.expiresAt)}.
            </p>
            <button type="button" onClick={() => setQr(null)} className="mt-3 text-xs font-semibold text-accent hover:underline">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
