"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_TAG_VIDEO_BYTES, SETUP_CODE_RE, TAG_VIDEO_SECONDS, cleanSetupCode } from "@/lib/tagFormat";
import { CantPrepareError, prepareVideo, videoDuration } from "./prepareVideo";

type Phase = "idle" | "preparing" | "uploading" | "saving" | "done";
const codeKey = (id: string) => `pm-tag-${id}`;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
  return json;
}

/** Uploads with a progress callback (fetch can't report upload progress). */
function put(url: string, blob: Blob, type: string, onProgress?: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again.")));
    xhr.onerror = () => reject(new Error("Upload failed. Please check your connection and try again."));
    xhr.send(blob);
  });
}

/** Adding (or changing) the video on a tag: setup code → pick or record → choose 10 seconds → upload. */
export function TagSetup({ tagId, hasVideo, ready }: { tagId: string; hasVideo: boolean; ready: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const [checking, setChecking] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [start, setStart] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  async function verify(value: string, quiet = false) {
    const c = cleanSetupCode(value);
    if (!SETUP_CODE_RE.test(c)) return quiet ? undefined : setError("The setup code has 6 letters and numbers.");
    setChecking(true);
    setError("");
    try {
      await postJson(`/api/tags/${tagId}/check`, { code: c });
      setCode(c);
      setCodeOk(true);
      try { window.localStorage.setItem(codeKey(tagId), c); } catch { /* ignore */ }
    } catch (e) {
      if (!quiet) setError((e as Error).message);
      try { window.localStorage.removeItem(codeKey(tagId)); } catch { /* ignore */ }
    } finally {
      setChecking(false);
    }
  }

  // The owner's phone remembers the code, so changing the video later doesn't need the card.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(codeKey(tagId)); } catch { /* ignore */ }
    if (saved) void verify(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function choose(f: File | undefined) {
    if (!f) return;
    setError("");
    if (f.type && !f.type.startsWith("video/")) return setError("Please choose a video.");
    setFile(f);
    setStart(0);
    setPreview(URL.createObjectURL(f));
    setDuration(await videoDuration(f));
  }

  const clip = duration ? Math.min(TAG_VIDEO_SECONDS, duration) : TAG_VIDEO_SECONDS;
  const maxStart = duration ? Math.max(0, duration - TAG_VIDEO_SECONDS) : 0;

  async function save() {
    if (!file) return;
    setError("");
    try {
      setPhase("preparing");
      setProgress(0);
      let video: Blob;
      let poster: Blob | null = null;
      let width: number | null = null;
      let height: number | null = null;
      try {
        ({ video, poster, width, height } = await prepareVideo(file, start, clip, setProgress));
      } catch (e) {
        // Older browsers can't prepare videos: a short MP4 can still be used as it is.
        if (!(e instanceof CantPrepareError) || file.type !== "video/mp4" || file.size > MAX_TAG_VIDEO_BYTES || (duration ?? 99) > TAG_VIDEO_SECONDS + 0.5) {
          throw new Error(e instanceof CantPrepareError
            ? "This phone can't prepare this video. Please try recording a new one, or use another phone."
            : "Something went wrong preparing your video. Please try again.");
        }
        video = file;
      }
      if (video.size > MAX_TAG_VIDEO_BYTES) throw new Error("That video is too large. Please choose a shorter one.");

      setPhase("uploading");
      setProgress(0);
      const links = await postJson(`/api/tags/${tagId}/upload-url`, { code, bytes: video.size });
      await put(links.video.url, video, "video/mp4", setProgress);
      if (poster) await put(links.poster.url, poster, "image/jpeg").catch(() => { poster = null; });

      setPhase("saving");
      await postJson(`/api/tags/${tagId}/save`, { code, video: links.video.key, poster: poster ? links.poster.key : null, width, height });
      setPhase("done");
    } catch (e) {
      setPhase("idle");
      setError((e as Error).message);
    }
  }

  if (!ready) {
    return <p className="mt-6 rounded-xl bg-card p-5 text-ink-soft">Video uploads aren&apos;t switched on yet. Please ask the studio.</p>;
  }

  if (phase === "done") {
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 text-center shadow-sm">
        <p className="text-4xl" aria-hidden>🎉</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Your video is on the tag!</h2>
        <p className="mt-2 text-ink-soft">Anyone who taps the tag with their phone will see it.</p>
        <button type="button" onClick={() => router.replace(`/v/${tagId}`)} className="btn btn-primary mt-5">Watch it now</button>
      </div>
    );
  }

  const busy = phase !== "idle";
  return (
    <div className="mt-6 space-y-5">
      {!codeOk ? (
        <form onSubmit={(e) => { e.preventDefault(); void verify(code); }} className="rounded-2xl bg-card p-5 shadow-sm">
          <label className="text-sm font-semibold" htmlFor="setup-code">Setup code</label>
          <p className="text-xs text-ink-soft">It&apos;s on the card that came with your tag.</p>
          <div className="mt-2 flex gap-2">
            <input id="setup-code" value={code} onChange={(e) => setCode(cleanSetupCode(e.target.value))} autoComplete="one-time-code"
              autoCapitalize="characters" spellCheck={false} placeholder="e.g. K7Q2MX"
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 font-mono text-lg tracking-[0.3em] uppercase" />
            <button type="submit" disabled={checking} className="btn btn-primary disabled:opacity-60">{checking ? "Checking…" : "Continue"}</button>
          </div>
        </form>
      ) : !file ? (
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <p className="font-semibold">Choose your video</p>
          <p className="text-sm text-ink-soft">Up to {TAG_VIDEO_SECONDS} seconds. If it&apos;s longer, you&apos;ll choose which {TAG_VIDEO_SECONDS} seconds to keep.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="btn btn-primary cursor-pointer justify-center">
              🎥 Record a video
              <input type="file" accept="video/*" capture="environment" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
            </label>
            <label className="btn btn-ghost cursor-pointer justify-center">
              Choose from gallery
              <input type="file" accept="video/*" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="mx-auto max-w-xs overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              src={preview ?? undefined}
              playsInline
              muted
              autoPlay
              controls
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.currentTime > start + clip || v.currentTime < start - 0.3) v.currentTime = start;
              }}
              className="max-h-[50vh] w-full"
            />
          </div>
          {duration !== null && duration > TAG_VIDEO_SECONDS + 0.05 && (
            <label className="mt-4 block text-sm font-semibold">
              Choose your {TAG_VIDEO_SECONDS} seconds
              <input type="range" min={0} max={maxStart} step={0.1} value={start} disabled={busy}
                onChange={(e) => { const s = Number(e.target.value); setStart(s); if (videoRef.current) videoRef.current.currentTime = s; }}
                className="mt-2 w-full accent-[var(--accent)]" aria-label="Start of the clip" />
              <span className="block text-xs font-normal text-ink-soft">
                Keeps {mmss(start)} – {mmss(start + clip)} of your {mmss(duration)} video
              </span>
            </label>
          )}
          {busy ? (
            <div className="mt-5" role="status">
              <p className="text-sm font-semibold">
                {phase === "preparing" ? "Preparing your video…" : phase === "uploading" ? "Uploading…" : "Saving…"}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round((phase === "saving" ? 1 : progress) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-soft">Please keep this page open.</p>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={save} className="btn btn-primary">{hasVideo ? "Replace the video" : "Save to my tag"}</button>
              <button type="button" onClick={() => { setFile(null); setPreview(null); setDuration(null); }} className="btn btn-ghost">Choose another</button>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-sm font-semibold text-accent" role="alert">{error}</p>}
    </div>
  );
}
