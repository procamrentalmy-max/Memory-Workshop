/**
 * Checks the start of a file is an MP4 and reads its length in seconds from the "mvhd" box
 * (prepared videos have it at the front). Returns null if it isn't an MP4.
 */
export function readMp4Info(b: Uint8Array): { seconds: number | null } | null {
  if (b.length < 12 || b[4] !== 0x66 || b[5] !== 0x74 || b[6] !== 0x79 || b[7] !== 0x70) return null; // "ftyp"
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  for (let i = 8; i + 36 <= b.length; i++) {
    if (b[i] !== 0x6d || b[i + 1] !== 0x76 || b[i + 2] !== 0x68 || b[i + 3] !== 0x64) continue; // "mvhd"
    const version = b[i + 4];
    const timescale = dv.getUint32(version === 1 ? i + 24 : i + 16);
    const duration = version === 1 ? Number(dv.getBigUint64(i + 28)) : dv.getUint32(i + 20);
    return { seconds: timescale ? duration / timescale : null };
  }
  return { seconds: null };
}

/** True if the bytes start like a JPEG image. */
export const isJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
