// Server-only: customer accounts (mobile number + password) and their logins.
//
// A login is a random token kept in an HttpOnly cookie; the database only stores its SHA-256 hash.
// Each login also has a "home screen key" (derived from its token) that goes into the start address of
// the home screen app. On iPhones a home screen app doesn't share Safari's cookies, so opening the app
// with that key logs it in by itself, and it stays logged in.
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, cookieOptions } from "./accountCookie";
import { MIN_PASSWORD_LENGTH } from "./accountRules";
import { db } from "./supabase";

export { SESSION_COOKIE, cookieOptions };

const MAX_FAILED_LOGINS = 10;
const LOCK_MINUTES = 15;
const LOGIN_LINK_MINUTES = 15;

export type Customer = { id: string; name: string; phone: string; createdAt: string };
export type CustomerSession = { id: string; token: string; canResetPassword: boolean; customer: Customer };


/* ───────── Phone numbers ───────── */

/**
 * Turns what the customer typed into digits with the country code, e.g. "012-345 6789" → "60123456789".
 * Numbers without "+" are taken as Malaysian. Returns null if it can't be a phone number.
 */
export function normalisePhone(input: string): string | null {
  const raw = input.trim();
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) {
    // already has its country code
  } else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `60${digits.slice(1)}`;
  else if (!digits.startsWith("60")) digits = `60${digits}`;
  if (digits.startsWith("60")) return /^60\d{8,10}$/.test(digits) ? digits : null;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

/** "60123456789" → "+60 12-345 6789". */
export function formatPhone(digits: string): string {
  if (!digits.startsWith("60")) return `+${digits}`;
  const rest = digits.slice(2);
  const area = rest.startsWith("1") ? rest.slice(0, 2) : rest.slice(0, 1);
  const local = rest.slice(area.length);
  const split = local.length - 4;
  return `+60 ${area}-${local.slice(0, split)} ${local.slice(split)}`;
}

/* ───────── Passwords (scrypt) ───────── */

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const derive = (password: string, salt: Buffer, length: number, opts: typeof SCRYPT) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, length, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(password, Buffer.from(salt, "base64url"), expected.length, { ...SCRYPT, N: Number(n), r: Number(r), p: Number(p) });
  return timingSafeEqual(key, expected);
}

export const passwordProblem = (password: string) =>
  password.length < MIN_PASSWORD_LENGTH ? `Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` : password.length > 200 ? "That password is too long." : null;

/* ───────── Tokens ───────── */

const newToken = () => randomBytes(32).toString("base64url");
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
/** The home screen key for a login (derived from its token, so it never needs storing). */
export const launchKeyFor = (token: string) => createHmac("sha256", token).update("home-screen").digest("base64url");
const looksLikeToken = (s: string) => /^[A-Za-z0-9_-]{40,60}$/.test(s);

/* ───────── Accounts ───────── */

type CustomerRow = { id: string; name: string; phone: string; created_at: string };
const toCustomer = (r: CustomerRow): Customer => ({ id: r.id, name: r.name, phone: r.phone, createdAt: r.created_at });

export async function createCustomer(name: string, phone: string, password: string): Promise<{ id: string } | { error: "exists" }> {
  const { data, error } = await db()
    .from("customers")
    .insert({ name, phone, password_hash: await hashPassword(password) })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "exists" };
    throw new Error(`Could not create the account: ${error.message}`);
  }
  return { id: data.id as string };
}

/** Checks a mobile number and password. After 10 wrong tries the account is locked for 15 minutes. */
export async function checkLogin(phone: string, password: string): Promise<{ id: string } | { error: "wrong" | "locked" }> {
  const { data, error } = await db().from("customers").select("id,password_hash,failed_logins,locked_until").eq("phone", phone).maybeSingle();
  if (error) throw new Error(`Could not check the login: ${error.message}`);
  if (!data) {
    await hashPassword(password); // same time taken whether or not the number has an account
    return { error: "wrong" };
  }
  if (data.locked_until && new Date(data.locked_until).getTime() > Date.now()) return { error: "locked" };
  if (await passwordMatches(password, data.password_hash)) {
    if (data.failed_logins) await db().from("customers").update({ failed_logins: 0, locked_until: null }).eq("id", data.id);
    return { id: data.id };
  }
  const failed = (data.failed_logins ?? 0) + 1;
  const lock = failed >= MAX_FAILED_LOGINS;
  await db()
    .from("customers")
    .update({ failed_logins: lock ? 0 : failed, locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null })
    .eq("id", data.id);
  return { error: lock ? "locked" : "wrong" };
}

export async function setPassword(customerId: string, password: string) {
  const { error } = await db().from("customers").update({ password_hash: await hashPassword(password), failed_logins: 0, locked_until: null }).eq("id", customerId);
  if (error) throw new Error(`Could not change the password: ${error.message}`);
}

export async function verifyPassword(customerId: string, password: string): Promise<boolean> {
  const { data, error } = await db().from("customers").select("password_hash").eq("id", customerId).single();
  if (error) throw new Error(`Could not check the password: ${error.message}`);
  return passwordMatches(password, data.password_hash);
}

/* ───────── Logins ───────── */

/** Starts a login for a customer and returns its token (for the cookie). */
export async function createSession(customerId: string, opts: { canResetPassword?: boolean; userAgent?: string | null } = {}): Promise<string> {
  const token = newToken();
  const { error } = await db().from("customer_sessions").insert({
    customer_id: customerId,
    token_hash: sha256(token),
    launch_hash: sha256(launchKeyFor(token)),
    can_reset_password: opts.canResetPassword ?? false,
    user_agent: opts.userAgent?.slice(0, 300) ?? null,
  });
  if (error) throw new Error(`Could not log in: ${error.message}`);
  await db().from("customers").update({ last_seen_at: new Date().toISOString() }).eq("id", customerId);
  return token;
}

/** Sets the login cookie (only in a Server Function or Route Handler). */
export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions());
}

type SessionRow = { id: string; can_reset_password: boolean; customer: CustomerRow | null };

async function sessionByToken(token: string): Promise<CustomerSession | null> {
  if (!looksLikeToken(token)) return null;
  const { data, error } = await db()
    .from("customer_sessions")
    .select("id,can_reset_password,customer:customers(id,name,phone,created_at)")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  if (error) throw new Error(`Could not load the login: ${error.message}`);
  const row = data as SessionRow | null;
  if (!row?.customer) return null;
  return { id: row.id, token, canResetPassword: row.can_reset_password, customer: toCustomer(row.customer) };
}

/** The logged-in customer for this request, or null. */
export async function getSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sessionByToken(token) : null;
}

/** Notes that a login was used (the home screen app was opened). */
export async function touchSession(session: CustomerSession) {
  const now = new Date().toISOString();
  await db().from("customer_sessions").update({ last_used_at: now }).eq("id", session.id);
  await db().from("customers").update({ last_seen_at: now }).eq("id", session.customer.id);
}

/**
 * The home screen app opened with a key: logs this app in as the customer whose login the key belongs to.
 * Returns the new login's token, or null if the key is unknown (for example after logging out).
 */
export async function sessionFromLaunchKey(key: string, userAgent: string | null): Promise<string | null> {
  if (!looksLikeToken(key)) return null;
  const { data, error } = await db().from("customer_sessions").select("id,customer_id").eq("launch_hash", sha256(key)).maybeSingle();
  if (error) throw new Error(`Could not open the app: ${error.message}`);
  if (!data) return null;
  await db().from("customer_sessions").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return createSession(data.customer_id, { userAgent });
}

/** Logs the customer out everywhere: every browser and home screen app. */
export async function endAllSessions(customerId: string) {
  const { error } = await db().from("customer_sessions").delete().eq("customer_id", customerId);
  if (error) throw new Error(`Could not log out: ${error.message}`);
}

export async function clearResetFlag(sessionId: string) {
  await db().from("customer_sessions").update({ can_reset_password: false }).eq("id", sessionId);
}

/* ───────── Staff help: one-time sign-in links ───────── */

/** Staff make a one-time sign-in link for a customer who forgot their password. Valid for 15 minutes. */
export async function createLoginLink(customerId: string): Promise<{ token: string; expiresAt: string }> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + LOGIN_LINK_MINUTES * 60_000).toISOString();
  const { error } = await db().from("customer_login_links").insert({ token_hash: sha256(token), customer_id: customerId, expires_at: expiresAt });
  if (error) throw new Error(`Could not make the sign-in link: ${error.message}`);
  return { token, expiresAt };
}

/** Uses up a sign-in link. Returns the customer's id, or null if it's unknown, used or expired. */
export async function redeemLoginLink(token: string): Promise<string | null> {
  if (!looksLikeToken(token)) return null;
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("customer_login_links")
    .update({ used_at: now })
    .eq("token_hash", sha256(token))
    .is("used_at", null)
    .gt("expires_at", now)
    .select("customer_id")
    .maybeSingle();
  if (error) throw new Error(`Could not check the sign-in link: ${error.message}`);
  return (data?.customer_id as string | undefined) ?? null;
}

/** Staff search: by mobile number (any part of it) or name. */
export async function findCustomers(query: string): Promise<Customer[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const local = digits.startsWith("0") ? digits.slice(1) : digits.startsWith("60") ? digits.slice(2) : digits;
  const filter = digits.length >= 3 ? `phone.like.%${local}%` : `name.ilike.%${q.replace(/[%_,()*\\]/g, "")}%`;
  const { data, error } = await db().from("customers").select("id,name,phone,created_at").or(filter).order("last_seen_at", { ascending: false, nullsFirst: false }).limit(10);
  if (error) throw new Error(`Could not search customers: ${error.message}`);
  return (data as CustomerRow[]).map(toCustomer);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await db().from("customers").select("id,name,phone,created_at").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the customer: ${error.message}`);
  return data ? toCustomer(data as CustomerRow) : null;
}

/* ───────── What's on a customer's page ───────── */

export type MyBadge = { id: string; hasVideo: boolean; maxSeconds: number; views: number; updatedAt: string | null };
export type MyOrder = { reference: string; createdAt: string; visitDate: string | null; total: number; walkIn: boolean; settled: boolean };

export async function customerBadges(customerId: string): Promise<MyBadge[]> {
  const { data, error } = await db().from("tags").select("id,video_file,max_seconds,views,video_updated_at").eq("customer_id", customerId).order("video_updated_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Could not load your badges: ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, hasVideo: !!r.video_file, maxSeconds: r.max_seconds ?? 10, views: r.views ?? 0, updatedAt: r.video_updated_at }));
}

export async function customerOrders(customerId: string): Promise<MyOrder[]> {
  const { data, error } = await db().from("bookings").select("reference,created_at,visit_date,total,walk_in,settled_at").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(20);
  if (error) throw new Error(`Could not load your orders: ${error.message}`);
  return (data ?? []).map((r) => ({ reference: r.reference, createdAt: r.created_at, visitDate: r.visit_date, total: Number(r.total), walkIn: !!r.walk_in, settled: !!r.settled_at }));
}

/** A Memory Badge set up while logged in joins the customer's page (if it isn't someone else's already). */
export async function linkTagToCustomer(tagId: string, customerId: string) {
  await db().from("tags").update({ customer_id: customerId }).eq("id", tagId).is("customer_id", null);
}
