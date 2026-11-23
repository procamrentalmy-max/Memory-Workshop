import { elementSrc, type CanvasItem } from "@/lib/types";

const FONT = { hand: "var(--font-hand)", display: "var(--font-display)", sans: "var(--font-body)" };

/** Renders the inside of one canvas item. Images always use object-contain, so they are never cropped. */
export function ItemContent({ item }: { item: CanvasItem }) {
  if (item.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={elementSrc(item.file)} alt={item.name} draggable={false} className="pointer-events-none h-full w-full select-none object-contain" />;
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
