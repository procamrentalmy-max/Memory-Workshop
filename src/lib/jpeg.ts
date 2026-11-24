/** What we need to know about a JPEG: its size in pixels and the camera's rotation flag (1 = upright). */
export type JpegInfo = { width: number; height: number; orientation: number };

/**
 * Reads a JPEG's pixel size and EXIF orientation from the start of the file (the first few hundred KB
 * are enough). Returns null if it isn't a JPEG.
 */
export function readJpegInfo(b: Uint8Array): JpegInfo | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return null;
  let i = 2;
  let orientation = 1;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; } // padding
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { i += 2; continue; } // markers without a length
    if (marker === 0xd9 || marker === 0xda) return null; // image data reached without finding the size
    const len = (b[i + 2] << 8) | b[i + 3];
    const start = i + 4;
    if (marker === 0xe1) orientation = exifOrientation(b, start, Math.min(b.length, start + len - 2)) ?? orientation;
    // Start-of-frame markers (C0–CF except C4 DHT, C8 JPG, CC DAC) hold the size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (start + 5 > b.length) return null;
      const height = (b[start + 1] << 8) | b[start + 2];
      const width = (b[start + 3] << 8) | b[start + 4];
      return width && height ? { width, height, orientation } : null;
    }
    i = start + len - 2;
  }
  return null;
}

function exifOrientation(b: Uint8Array, start: number, end: number): number | null {
  // "Exif\0\0", then a TIFF header: byte order, 42, offset of the first IFD.
  if (end - start < 14 || b[start] !== 0x45 || b[start + 1] !== 0x78 || b[start + 2] !== 0x69 || b[start + 3] !== 0x66) return null;
  const t = start + 6;
  const le = b[t] === 0x49; // "II" = little-endian
  const u16 = (p: number) => (le ? b[p] | (b[p + 1] << 8) : (b[p] << 8) | b[p + 1]);
  const u32 = (p: number) => (le ? (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) : ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3])) >>> 0;
  const ifd = t + u32(t + 4);
  if (ifd + 2 > end) return null;
  const count = u16(ifd);
  for (let k = 0; k < count; k++) {
    const e = ifd + 2 + k * 12;
    if (e + 12 > end) break;
    if (u16(e) === 0x0112) {
      const v = u16(e + 8);
      return v >= 1 && v <= 8 ? v : null;
    }
  }
  return null;
}
