import type { PhotoFill } from "@/lib/types";

// Photos the customer just uploaded are shown from the browser's own copy, so they appear instantly
// and aren't downloaded again.
const localCopies = new Map<string, string>();
export const rememberLocalPhoto = (file: string, url: string) => localCopies.set(file, url);
export const photoSrc = (file: string) => localCopies.get(file) ?? `/api/photos/${file}`;

/**
 * Draws a photo inside a frame window. The window must be a size container
 * (style containerType: "size") so cqw/cqh refer to it. Pure CSS, so it works at any size.
 */
export function PhotoImg({ fill }: { fill: PhotoFill }) {
  const r = fill.w / fill.h;
  const W = `(max(100cqw, 100cqh * ${r}) * ${fill.zoom})`;
  const H = `(${W} / ${r})`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoSrc(fill.file)}
      alt=""
      draggable={false}
      className="pointer-events-none absolute max-w-none select-none"
      style={{
        width: `calc${W}`,
        height: `calc${H}`,
        left: `calc((100cqw - ${W}) * ${fill.x / 100})`,
        top: `calc((100cqh - ${H}) * ${fill.y / 100})`,
      }}
    />
  );
}

export const clampFill = (f: PhotoFill): PhotoFill => ({
  ...f,
  zoom: Math.min(4, Math.max(1, f.zoom)),
  x: Math.min(100, Math.max(0, f.x)),
  y: Math.min(100, Math.max(0, f.y)),
});
