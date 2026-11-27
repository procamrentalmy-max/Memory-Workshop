"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createLoginLink, findCustomers, formatPhone, getCustomer } from "@/lib/accounts";
import { isStaffAuthorized } from "@/lib/adminAuth";
import { qrSvg, siteBase } from "@/lib/siteUrl";
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

/* ───────── Customer accounts ───────── */

async function requireStaffOnly() {
  if (!isStaffAuthorized((await headers()).get("authorization"))) throw new Error("Not authorised");
}

export type FoundCustomer = { id: string; name: string; phone: string };

/** Find a customer by mobile number (any part of it) or name. */
export async function searchCustomers(query: string): Promise<FoundCustomer[]> {
  await requireStaffOnly();
  const list = await findCustomers(String(query).slice(0, 40));
  return list.map((c) => ({ id: c.id, name: c.name, phone: formatPhone(c.phone) }));
}

/** A one-time sign-in QR code for a customer who forgot their password (valid 15 minutes). */
export async function makeSignInQr(customerId: string): Promise<{ name: string; svg: string; expiresAt: string }> {
  await requireStaffOnly();
  if (!/^[0-9a-f-]{36}$/.test(customerId)) throw new Error("Unknown customer");
  const customer = await getCustomer(customerId);
  if (!customer) throw new Error("Unknown customer");
  const { token, expiresAt } = await createLoginLink(customer.id);
  return { name: customer.name, svg: await qrSvg(`${await siteBase()}/me/signin/${token}`), expiresAt };
}
