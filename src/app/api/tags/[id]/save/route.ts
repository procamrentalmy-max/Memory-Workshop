import { isJpeg, readMp4Info } from "@/lib/mp4";
import { getTag, setTagVideo, tagCodeError } from "@/lib/tags";
import { MAX_TAG_VIDEO_BYTES, TAG_FILE_RE } from "@/lib/tagFormat";
import { tagStorage } from "@/lib/tagStorage";

/** After the upload: checks the video really is a short MP4, then puts it on the tag (replacing any old one). */
export async function POST(request: Request, ctx: RouteContext<"/api/tags/[id]/save">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const video = String(body?.video ?? "");
  const poster = body?.poster ? String(body.poster) : null;
  const width = Math.round(Number(body?.width)) || null;
  const height = Math.round(Number(body?.height)) || null;
  try {
    const denied = await tagCodeError(id, body?.code);
    if (denied) return denied;
    const storage = tagStorage();
    if (!storage) return Response.json({ error: "Video uploads aren't switched on yet. Please ask the studio." }, { status: 503 });
    const mine = (key: string) => TAG_FILE_RE.test(key) && key.startsWith(`v/${id}/`);
    if (!mine(video) || !video.endsWith(".mp4") || (poster !== null && (!mine(poster) || !poster.endsWith(".jpg")))) {
      return Response.json({ error: "Upload failed. Please try again." }, { status: 400 });
    }

    const maxSeconds = (await getTag(id))?.maxSeconds ?? 10;
    const bytes = await storage.size(video);
    const info = bytes ? readMp4Info((await storage.readStart(video, 1024 * 1024)) ?? new Uint8Array()) : null;
    const tooLong = info?.seconds != null && info.seconds > maxSeconds + 0.6;
    if (!bytes || bytes > MAX_TAG_VIDEO_BYTES || !info || tooLong) {
      await storage.remove([video, ...(poster ? [poster] : [])]);
      return Response.json({ error: tooLong ? `This tag takes videos of up to ${maxSeconds} seconds.` : "That video couldn't be used. Please try another." }, { status: 400 });
    }
    const posterOk = poster ? isJpeg((await storage.readStart(poster, 16)) ?? new Uint8Array()) : false;
    if (poster && !posterOk) await storage.remove([poster]);

    await setTagVideo(id, {
      videoFile: video, posterFile: posterOk ? poster : null, bytes,
      seconds: Math.round((info.seconds ?? maxSeconds) * 100) / 100, width, height,
    });
    return Response.json({ ok: true, url: storage.publicUrl(video) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "We couldn't save your video. Please try again." }, { status: 500 });
  }
}
