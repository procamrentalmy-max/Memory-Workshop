// Video storage for NFC tags: Cloudflare R2 (S3-compatible). Not Supabase.
//
// In Vercel, set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL
// (the bucket's public address, e.g. https://pub-xxxx.r2.dev or your own videos.example.com).
// For testing on a computer only: TAG_STORAGE=local keeps the files in a temporary folder instead.
import { AwsClient } from "aws4fetch";
import { mkdir, open, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type TagStorage = {
  name: string;
  /** A one-time link the browser uploads the file to (HTTP PUT with a Content-Type header). */
  uploadUrl(key: string): Promise<string>;
  /** Where viewers load the file from. */
  publicUrl(key: string): string;
  /** The stored file's size in bytes, or null if it isn't there. */
  size(key: string): Promise<number | null>;
  /** The first `bytes` bytes of the stored file, or null if it isn't there. */
  readStart(key: string, bytes: number): Promise<Uint8Array | null>;
  remove(keys: string[]): Promise<void>;
};

function r2Storage(): TagStorage | null {
  const { R2_ACCOUNT_ID: account, R2_ACCESS_KEY_ID: keyId, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket, R2_PUBLIC_URL: pub } = process.env;
  if (!account || !keyId || !secret || !bucket || !pub) return null;
  const client = new AwsClient({ accessKeyId: keyId, secretAccessKey: secret, service: "s3", region: "auto" });
  const objectUrl = (key: string) => `https://${account}.r2.cloudflarestorage.com/${bucket}/${key}`;
  return {
    name: "Cloudflare R2",
    async uploadUrl(key) {
      const url = new URL(objectUrl(key));
      url.searchParams.set("X-Amz-Expires", "3600"); // the link works for 1 hour
      const signed = await client.sign(new Request(url, { method: "PUT" }), { aws: { signQuery: true } });
      return signed.url;
    },
    publicUrl: (key) => `${pub.replace(/\/$/, "")}/${key}`,
    async size(key) {
      const res = await client.fetch(objectUrl(key), { method: "HEAD" });
      return res.ok ? Number(res.headers.get("content-length")) : null;
    },
    async readStart(key, bytes) {
      const res = await client.fetch(objectUrl(key), { headers: { Range: `bytes=0-${bytes - 1}` } });
      return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    },
    async remove(keys) {
      await Promise.all(keys.map((k) => client.fetch(objectUrl(k), { method: "DELETE" })));
    },
  };
}

/** Testing only (TAG_STORAGE=local): files in a temporary folder, served by /api/tags/local-files. */
export const LOCAL_TAG_DIR = path.join(os.tmpdir(), "pm-tag-videos");
export const localFilePath = (key: string) => path.join(LOCAL_TAG_DIR, ...key.split("/"));
const localStorage: TagStorage = {
  name: "a folder on this computer (testing only)",
  uploadUrl: async (key) => `/api/tags/local-files/${key}`,
  publicUrl: (key) => `/api/tags/local-files/${key}`,
  size: async (key) => (await stat(localFilePath(key)).catch(() => null))?.size ?? null,
  async readStart(key, bytes) {
    const f = await open(localFilePath(key)).catch(() => null);
    if (!f) return null;
    try {
      const buf = new Uint8Array(bytes);
      const { bytesRead } = await f.read(buf, 0, bytes, 0);
      return buf.subarray(0, bytesRead);
    } finally {
      await f.close();
    }
  },
  async remove(keys) {
    await Promise.all(keys.map((k) => rm(localFilePath(k), { force: true })));
  },
};
export const ensureLocalDir = (key: string) => mkdir(path.dirname(localFilePath(key)), { recursive: true });

export const localTagStorageOn = () => process.env.TAG_STORAGE === "local" && !r2Storage();

/** The configured video storage, or null if it isn't set up yet. */
export function tagStorage(): TagStorage | null {
  return r2Storage() ?? (process.env.TAG_STORAGE === "local" ? localStorage : null);
}
