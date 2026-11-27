// Server-only helpers for links printed on QR codes and written into NFC tags.
import { headers } from "next/headers";
import QRCode from "qrcode";

/** Our public web address. */
export async function siteBase() {
  const h = await headers();
  return (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/$/, "");
}

/** A QR code as an SVG string. */
export const qrSvg = (url: string) =>
  QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#2a2420", light: "#ffffff" } });
