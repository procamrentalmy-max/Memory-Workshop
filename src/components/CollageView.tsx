import { layout, type Collage } from "@/lib/collage";
import { PhotoImg } from "./PhotoImg";

/** Read-only picture of a collage (thumbnails, order lists). */
export function CollageView({ collage, className = "" }: { collage: Collage; className?: string }) {
  const { leaves } = layout(collage.root);
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-white shadow-sm ${collage.orientation === "portrait" ? "aspect-[210/297]" : "aspect-[297/210]"} ${className}`}
      aria-hidden
    >
      {leaves.map(({ node, rect }) => (
        <div
          key={node.id}
          className="absolute overflow-hidden bg-paper-2"
          style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%`, containerType: "size", boxShadow: "inset 0 0 0 0.5px #fff" }}
        >
          {node.photo && <PhotoImg fill={node.photo} />}
        </div>
      ))}
    </div>
  );
}
