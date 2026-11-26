import { createReadStream } from "node:fs";
import { stat, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { MAX_TAG_VIDEO_BYTES, TAG_FILE_RE } from "@/lib/tagFormat";
import { ensureLocalDir, localFilePath, localTagStorageOn } from "@/lib/tagStorage";

// Testing only (TAG_STORAGE=local and no R2 keys): stands in for Cloudflare R2 on a computer.
// On the live site this answers 404.

async function keyOf(ctx: RouteContext<"/api/tags/local-files/[...key]">) {
  const key = (await ctx.params).key.join("/");
  return localTagStorageOn() && TAG_FILE_RE.test(key) ? key : null;
}
const typeOf = (key: string) => (key.endsWith(".mp4") ? "video/mp4" : "image/jpeg");

export async function PUT(request: Request, ctx: RouteContext<"/api/tags/local-files/[...key]">) {
  const key = await keyOf(ctx);
  if (!key) return new Response("Not found", { status: 404 });
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.length > MAX_TAG_VIDEO_BYTES) return new Response("Too large", { status: 413 });
  await ensureLocalDir(key);
  await writeFile(localFilePath(key), body);
  return new Response(null, { status: 200 });
}

/** Serves a file, with byte ranges (phones need them to play video). */
export async function GET(request: Request, ctx: RouteContext<"/api/tags/local-files/[...key]">) {
  const key = await keyOf(ctx);
  const info = key ? await stat(localFilePath(key)).catch(() => null) : null;
  if (!key || !info) return new Response("Not found", { status: 404 });
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get("range") ?? "");
  const size = info.size;
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    const stream = Readable.toWeb(createReadStream(localFilePath(key), { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { "Content-Type": typeOf(key), "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" },
    });
  }
  const stream = Readable.toWeb(createReadStream(localFilePath(key))) as ReadableStream;
  return new Response(stream, { headers: { "Content-Type": typeOf(key), "Content-Length": String(size), "Accept-Ranges": "bytes" } });
}
