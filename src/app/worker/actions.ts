"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isStaffAuthorized } from "@/lib/adminAuth";
import { setPrinted, settleBooking } from "@/lib/store";

async function requireStaff(reference: string) {
  if (!isStaffAuthorized((await headers()).get("authorization"))) throw new Error("Not authorised");
  if (!/^PM-[0-9A-F]{6}$/.test(reference)) throw new Error("Unknown order");
}

export async function markPrinted(reference: string, printed: boolean) {
  await requireStaff(reference);
  await setPrinted(reference, printed);
  revalidatePath("/worker");
  revalidatePath("/admin");
}

/** The customer has paid and is leaving: close the order and delete their photos. */
export async function settleBill(reference: string) {
  await requireStaff(reference);
  const result = await settleBooking(reference);
  revalidatePath("/worker");
  revalidatePath("/admin");
  return result;
}
