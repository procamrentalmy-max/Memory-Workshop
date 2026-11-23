"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { PAGE, heightForWidth } from "@/lib/pageSize";
import { deleteElement, getElement, updateElement } from "@/lib/store";

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
