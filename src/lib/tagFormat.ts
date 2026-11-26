// Shared by the browser and the server: NFC video tag formats and limits.

/** Tag ids are in the tag's link (/v/<id>): 8 characters, no look-alike letters. */
export const TAG_ID_RE = /^[a-hjkmnp-z2-9]{8}$/;
/** Setup codes are printed on the card that comes with a tag. */
export const SETUP_CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/;
export const cleanSetupCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

/** Video tags come in three lengths (sold as different badges); a tag's length is set when it's made. */
export const TAG_LENGTHS = [10, 30, 60] as const;
export type TagLength = (typeof TAG_LENGTHS)[number];
export const TAG_VIDEO_SECONDS: TagLength = 10;
/** Largest video file we keep for a tag (prepared videos are about 3 MB per 10 seconds). */
export const MAX_TAG_VIDEO_BYTES = 30 * 1024 * 1024;
/** "10 seconds", "1 minute" */
export const lengthLabel = (s: number) => (s % 60 === 0 ? `${s / 60} minute${s === 60 ? "" : "s"}` : `${s} seconds`);
/** Where a tag's files live in video storage: v/<tag id>/<random>.mp4 / .jpg */
export const TAG_FILE_RE = /^v\/[a-hjkmnp-z2-9]{8}\/[0-9a-f-]{36}\.(mp4|jpg)$/;
