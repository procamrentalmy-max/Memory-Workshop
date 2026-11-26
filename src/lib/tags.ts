// Server-only: the list of NFC video tags (in the Supabase database). The videos themselves are in
// Cloudflare R2 (see tagStorage.ts).
import { db } from "./supabase";
import { tagStorage } from "./tagStorage";

export type Tag = {
  id: string;
  setupCode: string;
  batch: string | null;
  createdAt: string;
  videoFile: string | null;
  posterFile: string | null;
  videoBytes: number | null;
  videoSeconds: number | null;
  videoWidth: number | null;
  videoHeight: number | null;
  videoUpdatedAt: string | null;
  views: number;
  lastViewedAt: string | null;
  disabled: boolean;
  maxSeconds: number; // the longest video this tag takes: 10, 20 or 30 s
};

type TagRow = {
  id: string; setup_code: string; batch: string | null; created_at: string; video_file: string | null; poster_file: string | null;
  video_bytes: number | null; video_seconds: string | number | null; video_width: number | null; video_height: number | null;
  video_updated_at: string | null; views: number; last_viewed_at: string | null; disabled: boolean; max_seconds: number;
};
const COLUMNS = "id,setup_code,batch,created_at,video_file,poster_file,video_bytes,video_seconds,video_width,video_height,video_updated_at,views,last_viewed_at,disabled,max_seconds";
const toTag = (r: TagRow): Tag => ({
  id: r.id, setupCode: r.setup_code, batch: r.batch, createdAt: r.created_at, videoFile: r.video_file, posterFile: r.poster_file,
  videoBytes: r.video_bytes, videoSeconds: r.video_seconds === null ? null : Number(r.video_seconds), videoWidth: r.video_width,
  videoHeight: r.video_height, videoUpdatedAt: r.video_updated_at, views: r.views, lastViewedAt: r.last_viewed_at, disabled: r.disabled,
  maxSeconds: r.max_seconds ?? 10,
});

const pick = (alphabet: string, n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => alphabet[b % alphabet.length]).join("");
const newTagId = () => pick("abcdefghjkmnpqrstuvwxyz23456789", 8);
const newSetupCode = () => pick("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);

export async function getTag(id: string): Promise<Tag | null> {
  const { data, error } = await db().from("tags").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the tag: ${error.message}`);
  return data ? toTag(data as TagRow) : null;
}

export async function listTags(limit = 300): Promise<Tag[]> {
  const { data, error } = await db().from("tags").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Could not load tags: ${error.message}`);
  return (data as TagRow[]).map(toTag);
}

/** Totals for the admin page: how many tags, videos, storage and views. */
export async function tagStats() {
  const { data, error } = await db().from("tags").select("video_bytes,views,video_file");
  if (error) throw new Error(`Could not load tags: ${error.message}`);
  const rows = data as { video_bytes: number | null; views: number; video_file: string | null }[];
  const withVideo = rows.filter((r) => r.video_file);
  const bytes = withVideo.reduce((s, r) => s + (r.video_bytes ?? 0), 0);
  return { tags: rows.length, videos: withVideo.length, bytes, views: rows.reduce((s, r) => s + r.views, 0) };
}

/** Makes a batch of new tags (new links and setup codes) to write onto NFC tags. */
export async function createTags(count: number, batch: string, maxSeconds: number): Promise<number> {
  const rows = Array.from({ length: count }, () => ({ id: newTagId(), setup_code: newSetupCode(), batch, max_seconds: maxSeconds }));
  const { error } = await db().from("tags").insert(rows);
  if (error) throw new Error(`Could not create tags: ${error.message}`);
  return rows.length;
}

/**
 * Checks a tag's setup code. After 10 wrong tries the tag is locked for 15 minutes, so codes can't be guessed.
 * Returns "ok", "wrong", "locked", or "missing" (no such tag, or switched off).
 */
export async function checkSetupCode(id: string, code: string): Promise<"ok" | "wrong" | "locked" | "missing"> {
  const { data, error } = await db().from("tags").select("setup_code,disabled,failed_attempts,locked_until").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not check the code: ${error.message}`);
  if (!data || data.disabled) return "missing";
  if (data.locked_until && new Date(data.locked_until).getTime() > Date.now()) return "locked";
  const expected = String(data.setup_code);
  let diff = expected.length ^ code.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (code.charCodeAt(i) || 0);
  if (diff === 0) {
    if (data.failed_attempts) await db().from("tags").update({ failed_attempts: 0, locked_until: null }).eq("id", id);
    return "ok";
  }
  const failed = (data.failed_attempts ?? 0) + 1;
  await db().from("tags").update(
    failed >= 10 ? { failed_attempts: 0, locked_until: new Date(Date.now() + 15 * 60_000).toISOString() } : { failed_attempts: failed },
  ).eq("id", id);
  return failed >= 10 ? "locked" : "wrong";
}

/** Saves a tag's new video and deletes the one it replaces. */
export async function setTagVideo(id: string, v: { videoFile: string; posterFile: string | null; bytes: number; seconds: number; width: number | null; height: number | null }) {
  const old = await getTag(id);
  const { error } = await db().from("tags").update({
    video_file: v.videoFile, poster_file: v.posterFile, video_bytes: v.bytes, video_seconds: v.seconds,
    video_width: v.width, video_height: v.height, video_updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(`Could not save the video: ${error.message}`);
  const stale = [old?.videoFile, old?.posterFile].filter((f): f is string => !!f && f !== v.videoFile && f !== v.posterFile);
  if (stale.length) await tagStorage()?.remove(stale);
}

/** Admin: removes a tag's video (the tag can be set up again with its setup code). */
export async function clearTagVideo(id: string) {
  const old = await getTag(id);
  const { error } = await db().from("tags").update({
    video_file: null, poster_file: null, video_bytes: null, video_seconds: null, video_width: null, video_height: null, video_updated_at: null,
  }).eq("id", id);
  if (error) throw new Error(`Could not remove the video: ${error.message}`);
  const files = [old?.videoFile, old?.posterFile].filter((f): f is string => !!f);
  if (files.length) await tagStorage()?.remove(files);
}

export async function setTagDisabled(id: string, disabled: boolean) {
  const { error } = await db().from("tags").update({ disabled }).eq("id", id);
  if (error) throw new Error(`Could not update the tag: ${error.message}`);
}

export async function countTagView(id: string) {
  await db().rpc("count_tag_view", { tag: id });
}

/** For the tag API routes: checks the tag id and setup code; returns an error response, or null if all is well. */
export async function tagCodeError(id: string, rawCode: unknown): Promise<Response | null> {
  const { TAG_ID_RE, SETUP_CODE_RE, cleanSetupCode } = await import("./tagFormat");
  const code = cleanSetupCode(String(rawCode ?? ""));
  if (!TAG_ID_RE.test(id)) return Response.json({ error: "This tag isn't recognised." }, { status: 404 });
  if (!SETUP_CODE_RE.test(code)) return Response.json({ error: "The setup code has 6 letters and numbers. Please check the card." }, { status: 400 });
  const result = await checkSetupCode(id, code);
  if (result === "missing") return Response.json({ error: "This tag isn't active." }, { status: 404 });
  if (result === "locked") return Response.json({ error: "Too many wrong codes. Please wait 15 minutes and try again." }, { status: 429 });
  if (result === "wrong") return Response.json({ error: "That setup code doesn't match this tag. Please check the card." }, { status: 403 });
  return null;
}
