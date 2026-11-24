import { clipPath, shapeOutline, type ShapeSheet } from "@/lib/shapes";
import { PhotoImg } from "./PhotoImg";

/** Read-only picture of a photo shapes sheet (thumbnails, order lists). */
export function ShapesView({ sheet, className = "" }: { sheet: ShapeSheet; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-white shadow-sm ${sheet.orientation === "portrait" ? "aspect-[210/297]" : "aspect-[297/210]"} ${className}`}
      aria-hidden
    >
      {sheet.shapes.map((s) => (
        <div
          key={s.id}
          className={`absolute overflow-hidden ${s.photo ? "" : "bg-paper-2"}`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, clipPath: clipPath(shapeOutline(s, sheet.orientation)), containerType: "size" }}
        >
          {s.photo && <PhotoImg fill={s.photo} />}
        </div>
      ))}
    </div>
  );
}
