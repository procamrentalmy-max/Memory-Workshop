"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/accountRules";
import { signUp, type AuthState } from "../me/actions";

const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base";

export function JoinForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, {});
  const [show, setShow] = useState(false);
  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-semibold">
        Your name
        <input name="name" autoComplete="name" required maxLength={80} defaultValue={state.name} className={field} />
      </label>
      <label className="block text-sm font-semibold">
        Mobile number
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="012-345 6789"
          defaultValue={state.phone}
          className={field}
        />
        <span className="mt-1 block text-xs font-normal text-ink-soft">You&apos;ll log in with this. Not Malaysian? Start with + and your country code.</span>
      </label>
      <label className="block text-sm font-semibold">
        Choose a password
        <span className="relative block">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            className={`${field} pr-16`}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-ink-soft">
            {show ? "Hide" : "Show"}
          </button>
        </span>
        <span className="mt-1 block text-xs font-normal text-ink-soft">At least {MIN_PASSWORD_LENGTH} characters.</span>
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? "Creating your account…" : "Create my account"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        Already have an account? <Link href="/login" className="font-semibold text-ink underline">Log in</Link>
      </p>
    </form>
  );
}
