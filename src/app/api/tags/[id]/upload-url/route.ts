import { tagCodeError } from "@/lib/tags";
import { MAX_TAG_VIDEO_BYTES } from "@/lib/tagFormat";
import { tagStorage } from "@/lib/tagStorage";

/** One-time upload links for a tag's prepared video and its poster image (uploaded straight to video storage). */
export async function POST(request: Request, ctx: RouteContext<"/api/tags/[id]/upload-url">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  try {
    const denied = await tagCodeError(id, body?.code);
    if (denied) return denied;
    if (!(Number(body?.bytes) > 0) || Number(body.bytes) > MAX_TAG_VIDEO_BYTES) {
      return Response.json({ error: "That video is too large. Please choose a shorter one." }, { status: 413 });
    }
    const storage = tagStorage();
    if (!storage) return Response.json({ error: "Video uploads aren't switched on yet. Please ask the studio." }, { status: 503 });
    const name = crypto.randomUUID();
    const video = `v/${id}/${name}.mp4`;
    const poster = `v/${id}/${name}.jpg`;
    return Response.json({
      video: { key: video, url: await storage.uploadUrl(video) },
      poster: { key: poster, url: await storage.uploadUrl(poster) },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
