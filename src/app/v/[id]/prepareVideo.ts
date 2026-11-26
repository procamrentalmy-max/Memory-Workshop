"use client";

// Turns a phone video into a small MP4 that plays on every phone: the chosen 10 seconds, 720p, H.264,
// with the original sound. Runs in the browser (WebCodecs), so only the small file is uploaded.

export class CantPrepareError extends Error {}

let aacReady: Promise<void> | null = null;

/** Prepares the 10 seconds from `start`. `onProgress` gets 0–1. */
export async function prepareVideo(file: File, start: number, seconds: number, onProgress: (p: number) => void) {
  if (typeof VideoEncoder === "undefined" || typeof VideoDecoder === "undefined") throw new CantPrepareError("unsupported");
  const mb = await import("mediabunny");
  // Phones without their own AAC encoder use Mediabunny's (only needed if the sound has to be re-encoded).
  aacReady ??= (async () => {
    if (!(await mb.canEncodeAudio("aac"))) (await import("@mediabunny/aac-encoder")).registerAacEncoder();
  })();
  await aacReady;

  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new CantPrepareError("no-video");
  const dw = await track.getDisplayWidth();
  const dh = await track.getDisplayHeight();
  const scale = Math.min(1, 720 / Math.min(dw, dh)); // the short side becomes 720 px at most
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  const width = even(dw * scale);
  const height = even(dh * scale);

  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target: new mb.BufferTarget() });
  const conversion = await mb.Conversion.init({
    input,
    output,
    tracks: "primary",
    video: { width, height, fit: "fill", codec: "avc", quality: new mb.Quality({ bitrate: 2_500_000 }), frameRate: 30, allowTransformationMetadata: false },
    audio: { codec: "aac" }, // the phone's AAC sound is copied as it is; anything else becomes AAC
    trim: { start, end: start + seconds },
  });
  if (conversion.discardedTracks.length) {
    console.warn("Video tracks left out:", conversion.discardedTracks.map((d) => `${d.track.type} ${d.track.codec}: ${d.reason}`).join("; "));
  }
  if (!conversion.isValid || conversion.discardedTracks.some((d) => d.track.type === "video")) throw new CantPrepareError("undecodable");
  conversion.onProgress = (p) => onProgress(p);
  await conversion.execute();
  const buffer = (output.target as InstanceType<typeof mb.BufferTarget>).buffer!;
  const video = new Blob([buffer], { type: "video/mp4" });

  // A still from the start of the video, shown while it loads.
  let poster: Blob | null = null;
  try {
    const check = new mb.Input({ source: new mb.BlobSource(video), formats: mb.ALL_FORMATS });
    const vt = await check.getPrimaryVideoTrack();
    const frame = vt ? await new mb.CanvasSink(vt, { poolSize: 0 }).getCanvas(0.2) : null;
    if (frame) {
      const c = frame.canvas;
      poster = "convertToBlob" in c
        ? await c.convertToBlob({ type: "image/jpeg", quality: 0.82 })
        : await new Promise<Blob | null>((r) => (c as HTMLCanvasElement).toBlob(r, "image/jpeg", 0.82));
    }
  } catch { /* the video still works without a still */ }

  return { video, poster, width, height };
}

/** The video's length in seconds (read from the file itself, so it works for any format the browser can open). */
export async function videoDuration(file: File): Promise<number | null> {
  try {
    const mb = await import("mediabunny");
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    return await input.computeDuration();
  } catch {
    return null;
  }
}
