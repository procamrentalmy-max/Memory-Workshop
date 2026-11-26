"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { newStudioCode } from "@/lib/store";
import { clearTagVideo, createTags, setTagDisabled } from "@/lib/tags";
import { TAG_ID_RE, TAG_LENGTHS } from "@/lib/tagFormat";

async function requireAdmin() {
  if (!isAdminAuthorized((await headers()).get("authorization"))) throw new Error("Not authorised");
}

/** A new code for the in-store QR code; old printed QR codes stop working. */
export async function changeStudioCode() {
  await requireAdmin();
  await newStudioCode();
  revalidatePath("/admin");
}

/** A new batch of NFC tags: each gets its own link and setup code. */
export async function createTagBatch(formData: FormData) {
  await requireAdmin();
  const count = Math.round(Number(formData.get("count")));
  const seconds = Number(formData.get("seconds"));
  if (!(count >= 1 && count <= 200) || !TAG_LENGTHS.includes(seconds as never)) return;
  const batch = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(new Date()).replace(", ", " ");
  await createTags(count, `${batch} · ${seconds} s`, seconds);
  revalidatePath("/admin");
}

export async function removeTagVideo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (TAG_ID_RE.test(id)) await clearTagVideo(id);
  revalidatePath("/admin");
}

export async function toggleTag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (TAG_ID_RE.test(id)) await setTagDisabled(id, formData.get("disabled") === "1");
  revalidatePath("/admin");
}
