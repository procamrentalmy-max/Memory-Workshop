"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { PAGE, heightForWidth } from "@/lib/pageSize";
import { deleteElement, getElement, newStudioCode, updateElement } from "@/lib/store";
import { clearTagVideo, createTags, setTagDisabled } from "@/lib/tags";
import { TAG_ID_RE } from "@/lib/tagFormat";

async function requireAdmin() {
  if (!isAdminAuthorized((await headers()).get("authorization"))) throw new Error("Not authorised");
}

export async function saveElement(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const price = Number(formData.get("price"));
  const requestedWidth = Number(formData.get("widthCm"));
  if (!name || !Number.isFinite(price) || price < 0 || !(requestedWidth > 0)) return;

  const el = await getElement(id);
  if (!el) return;
  // Keep the image's proportions and never exceed the A4 page.
  const maxWidth = Math.min(PAGE.widthCm, (PAGE.heightCm * el.width) / el.height);
  const widthCm = Math.round(Math.min(requestedWidth, maxWidth) * 100) / 100;
  const heightCm = Math.min(heightForWidth(widthCm, el), PAGE.heightCm);

  await updateElement(id, { name, price: Math.round(price * 100) / 100, widthCm, heightCm });
  revalidatePath("/admin");
  revalidatePath("/book");
}

export async function removeElement(formData: FormData) {
  await requireAdmin();
  await deleteElement(String(formData.get("id")));
  revalidatePath("/admin");
  revalidatePath("/book");
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
  if (!(count >= 1 && count <= 200)) return;
  const batch = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(new Date()).replace(", ", " ");
  await createTags(count, batch);
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
