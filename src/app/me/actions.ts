"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  checkLogin,
  clearResetFlag,
  createCustomer,
  createSession,
  endAllSessions,
  getSession,
  normalisePhone,
  passwordProblem,
  setPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/accounts";

export type AuthState = { error?: string; name?: string; phone?: string };
export type PasswordState = { error?: string };

/** Only addresses on this site, so a link can't send someone elsewhere after logging in. */
const safeNext = (value: FormDataEntryValue | null) => {
  const s = String(value ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/me";
};

const userAgent = async () => (await headers()).get("user-agent");

/** Creates an account (at the counter on a first visit, or online) and logs in. */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const phoneInput = String(formData.get("phone") ?? "").slice(0, 30);
  const password = String(formData.get("password") ?? "");
  const keep = { name, phone: phoneInput };
  if (!name) return { ...keep, error: "Please enter your name." };
  const phone = normalisePhone(phoneInput);
  if (!phone) return { ...keep, error: "Please enter your mobile number, for example 012-345 6789." };
  const problem = passwordProblem(password);
  if (problem) return { ...keep, error: problem };
  try {
    const created = await createCustomer(name, phone, password);
    if ("error" in created) return { ...keep, error: "This number already has an account. Please log in instead." };
    await setSessionCookie(await createSession(created.id, { userAgent: await userAgent() }));
  } catch (e) {
    console.error(e);
    return { ...keep, error: "We couldn't create your account. Please try again, or ask our staff." };
  }
  redirect("/me?welcome=1");
}

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phoneInput = String(formData.get("phone") ?? "").slice(0, 30);
  const password = String(formData.get("password") ?? "");
  const phone = normalisePhone(phoneInput);
  if (!phone) return { phone: phoneInput, error: "Please enter the mobile number you signed up with." };
  try {
    const result = await checkLogin(phone, password.slice(0, 200));
    if ("error" in result) {
      return {
        phone: phoneInput,
        error: result.error === "locked"
          ? "Too many wrong tries. Please wait 15 minutes, or ask our staff to sign you in."
          : "That mobile number and password don't match. Please try again.",
      };
    }
    await setSessionCookie(await createSession(result.id, { userAgent: await userAgent() }));
  } catch (e) {
    console.error(e);
    return { phone: phoneInput, error: "We couldn't log you in. Please try again in a moment." };
  }
  redirect(safeNext(formData.get("next")));
}

/** Logs out everywhere, including the home screen app. */
export async function logOut() {
  const session = await getSession().catch(() => null);
  if (session) await endAllSessions(session.customer.id);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/** Change the password. After a staff sign-in (forgotten password), the old one isn't needed. */
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await getSession();
  if (!session) return { error: "Please log in again." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  try {
    if (!session.canResetPassword && !(await verifyPassword(session.customer.id, current.slice(0, 200)))) {
      return { error: "Your current password isn't right." };
    }
    await setPassword(session.customer.id, next);
    if (session.canResetPassword) await clearResetFlag(session.id);
  } catch (e) {
    console.error(e);
    return { error: "We couldn't change your password. Please try again." };
  }
  redirect("/me?password=saved");
}
