"use client";

import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/accountRules";
import { changePassword, type PasswordState } from "./actions";

const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base";

/** Change password. `reset`: signed in by staff after forgetting it, so the old password isn't asked for. */
export function PasswordForm({ reset }: { reset: boolean }) {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  return (
    <form action={formAction} className="mt-3 max-w-sm space-y-3">
      {!reset && (
        <label className="block text-sm font-semibold">
          Current password
          <input name="current" type="password" autoComplete="current-password" required className={field} />
        </label>
      )}
      <label className="block text-sm font-semibold">
        New password
        <input name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} className={field} />
        <span className="mt-1 block text-xs font-normal text-ink-soft">At least {MIN_PASSWORD_LENGTH} characters.</span>
      </label>
      {state.error && <p role="alert" className="text-sm text-accent">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
