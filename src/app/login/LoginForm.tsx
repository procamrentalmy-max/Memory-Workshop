"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { logIn, type AuthState } from "../me/actions";

const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base";

export function LoginForm() {
  const params = useSearchParams();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(logIn, {});
  const [show, setShow] = useState(false);
  const expired = params.get("link") === "expired";
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={params.get("next") ?? "/me"} />
      {expired && (
        <p className="rounded-lg bg-mustard/20 px-3 py-2 text-sm">
          That sign-in QR code has already been used or has run out. Please ask our staff for a new one.
        </p>
      )}
      <label className="block text-sm font-semibold">
        Mobile number
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="012-345 6789" defaultValue={state.phone} className={field} />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={`${field} pr-16`} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-ink-soft">
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        New here? <Link href="/join" className="font-semibold text-ink underline">Create an account</Link>
      </p>
      <p className="text-center text-xs text-ink-soft">Forgot your password? Ask our staff at the counter: they can sign you in with a QR code.</p>
    </form>
  );
}
