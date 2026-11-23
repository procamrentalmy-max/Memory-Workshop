import { elementSrc, type CanvasItem } from "@/lib/types";
import { PhotoImg } from "./PhotoImg";

const FONT = { hand: "var(--font-hand)", display: "var(--font-display)", sans: "var(--font-body)" };

/**
 * Renders the inside of one canvas item. Element images always use object-contain, so they are never cropped.
 * Photo frame elements show the customer's photo in their photo window; `editing` adds an "Add photo" hint.
 */
export function ItemContent({ item, editing = false }: { item: CanvasItem; editing?: boolean }) {
  if (item.type === "image") {
    const win = item.window;
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={elementSrc(item.file)} alt={item.name} draggable={false} className="pointer-events-none h-full w-full select-none object-contain" />
        {win && (
          <div
            data-photo-window
            className="absolute overflow-hidden"
            style={{ left: `${win.x}%`, top: `${win.y}%`, width: `${win.w}%`, height: `${win.h}%`, containerType: "size" }}
          >
            {item.photo ? (
              <PhotoImg fill={item.photo} />
            ) : editing ? (
              <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/15">
                <span className="rounded-full bg-white/95 px-[0.7em] py-[0.3em] font-sans font-bold leading-none text-ink shadow"
                  style={{ fontSize: "clamp(8px, 9cqmin, 14px)" }}>
                  ＋ Add photo
                </span>
              </span>
            ) : null}
          </div>
        )}
      </>
    );
  }
  if (item.type === "section") {
    return <div className="h-full w-full rounded-[2px]" style={{ background: item.color }} />;
  }
  return (
    <div
      className="h-full w-full overflow-hidden whitespace-pre-wrap break-words leading-tight"
      style={{ color: item.color, fontSize: `${item.size}cqw`, fontFamily: FONT[item.font] }}
    >
      {item.text}
    </div>
  );
}

export const boxStyle = (it: CanvasItem): React.CSSProperties => ({
  position: "absolute",
  left: `${it.x}%`,
  top: `${it.y}%`,
  width: `${it.w}%`,
  height: `${it.h}%`,
});

/** Read-only page preview (used for thumbnails and summaries). */
export function CanvasView({ items, background, className = "" }: { items: CanvasItem[]; background: string; className?: string }) {
  return (
    <div
      className={`relative aspect-[210/297] overflow-hidden rounded-md shadow-sm ${className}`}
      style={{ background, containerType: "inline-size" }}
      aria-hidden
    >
      {items.map((it) => (
        <div key={it.id} style={boxStyle(it)}>
          <ItemContent item={it} />
        </div>
      ))}
    </div>
  );
}
