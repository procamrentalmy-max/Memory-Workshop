import type { Category, Template } from "@/lib/data";
import type { PhotoFill } from "@/lib/types";
import { PhotoImg } from "./PhotoImg";

/**
 * Illustrated preview of a scrapbook page, drawn with CSS only. Sizes use container units (cqw),
 * so the same preview works as a large hero and as a tiny thumbnail.
 * Photo frames are numbered slots: pass `photos` to show customer photos in them, and
 * `onSlotClick` to make each frame a button (used where customers add their photos).
 */

/** How many photo frames each layout has (also used by the server to check orders). */
export const LAYOUT_SLOTS: Record<Template["layout"], number> = {
  grid: 4,
  polaroid: 2,
  collage: 5,
  pocket: 1,
  popup: 2,
  strip: 4,
};

// "︎" asks for the plain text glyph rather than a colour emoji.
const GLYPH: Record<Category, string> = {
  Travel: "✈︎",
  Couples: "♥︎",
  Friends: "★",
  Family: "✿",
  Celebrations: "✦",
  Everyday: "☼",
};

type SlotCtx = {
  primary: string;
  accent: string;
  photos?: Record<string, PhotoFill>;
  onSlotClick?: (slot: number, window: HTMLElement) => void;
};

function Slot({ i, ctx, style, caption = false, bare = false, tint = 0 }: {
  i: number; ctx: SlotCtx; style?: React.CSSProperties; caption?: boolean; bare?: boolean; tint?: number;
}) {
  const fill = ctx.photos?.[String(i)];
  const editable = Boolean(ctx.onSlotClick);
  const content = (
    <>
      {fill ? (
        <PhotoImg fill={fill} />
      ) : (
        <span
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 72% 28%, rgba(255,255,255,.6) 0 9%, transparent 10%),
              radial-gradient(ellipse 90% 50% at 25% 105%, rgba(0,0,0,.22) 98%, transparent 100%),
              radial-gradient(ellipse 80% 40% at 85% 110%, rgba(0,0,0,.14) 98%, transparent 100%),
              linear-gradient(165deg, ${ctx.accent}, ${ctx.primary})`,
            filter: tint ? `hue-rotate(${tint}deg)` : undefined,
          }}
        />
      )}
      {editable && !fill && (
        <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover/slot:bg-black/40">
          <span className="rounded-full bg-white/95 px-[0.7em] py-[0.3em] font-sans font-bold leading-none text-ink shadow"
            style={{ fontSize: "clamp(8px, 9cqw, 14px)" }}>
            ＋ Add photo
          </span>
        </span>
      )}
      {editable && fill && (
        <span className="absolute right-[4%] top-[4%] grid aspect-square place-items-center rounded-full bg-white/90 font-bold leading-none text-ink shadow"
          style={{ width: "clamp(16px, 16cqmin, 26px)", fontSize: "clamp(9px, 9cqmin, 14px)" }} aria-hidden>
          ✎
        </span>
      )}
    </>
  );
  const frame = editable ? (
    <button
      type="button"
      onClick={(e) => ctx.onSlotClick!(i, e.currentTarget)}
      aria-label={fill ? `Change photo ${i + 1}` : `Add photo ${i + 1}`}
      className="group/slot relative block h-full w-full cursor-pointer overflow-hidden"
      style={{ containerType: "size" }}
    >
      {content}
    </button>
  ) : (
    <div className="relative h-full w-full overflow-hidden" style={{ containerType: "size" }}>{content}</div>
  );

  if (bare) return <div className="relative flex-1">{frame}</div>;
  return (
    <div
      className="absolute bg-white"
      style={{ padding: "1.6cqw", paddingBottom: caption ? "6cqw" : "1.6cqw", boxShadow: "0 0.6cqw 1.4cqw rgba(0,0,0,.18)", ...style }}
    >
      {frame}
    </div>
  );
}

export function TemplatePreview({ template, className = "", photos, onSlotClick }: {
  template: Template;
  className?: string;
  photos?: Record<string, PhotoFill>;
  onSlotClick?: (slot: number, window: HTMLElement) => void;
}) {
  const [bg, primary, accent] = template.palette;
  const ctx: SlotCtx = { primary, accent, photos, onSlotClick };

  let body: React.ReactNode;
  switch (template.layout) {
    case "grid":
      body = (
        <>
          <Slot i={0} ctx={ctx} style={{ left: "8%", top: "22%", width: "40%", height: "30%" }} />
          <Slot i={1} ctx={ctx} style={{ left: "52%", top: "22%", width: "40%", height: "30%" }} />
          <Slot i={2} ctx={ctx} style={{ left: "8%", top: "55%", width: "40%", height: "30%" }} />
          <Slot i={3} ctx={ctx} style={{ left: "52%", top: "55%", width: "40%", height: "30%" }} />
        </>
      );
      break;
    case "polaroid":
      body = (
        <>
          <Slot i={0} ctx={ctx} caption style={{ left: "7%", top: "24%", width: "50%", height: "44%", rotate: "-7deg" }} />
          <Slot i={1} ctx={ctx} caption style={{ left: "43%", top: "38%", width: "50%", height: "44%", rotate: "6deg" }} />
        </>
      );
      break;
    case "collage":
      body = (
        <>
          <Slot i={0} ctx={ctx} style={{ left: "7%", top: "22%", width: "56%", height: "42%" }} />
          <Slot i={1} ctx={ctx} style={{ left: "66%", top: "22%", width: "27%", height: "20%" }} />
          <Slot i={2} ctx={ctx} style={{ left: "66%", top: "44%", width: "27%", height: "20%" }} />
          <Slot i={3} ctx={ctx} style={{ left: "7%", top: "67%", width: "40%", height: "20%" }} />
          <Slot i={4} ctx={ctx} style={{ left: "50%", top: "67%", width: "43%", height: "20%" }} />
        </>
      );
      break;
    case "pocket":
      body = (
        <>
          <Slot i={0} ctx={ctx} style={{ left: "12%", top: "21%", width: "56%", height: "34%", rotate: "-4deg" }} />
          {/* ticket peeking out of the pocket */}
          <div
            className="pointer-events-none absolute"
            style={{ right: "12%", top: "44%", width: "34%", height: "16%", rotate: "10deg", background: accent, borderRadius: "1cqw",
              WebkitMask: "radial-gradient(circle at 0 50%, transparent 3cqw, #000 3.2cqw) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 3cqw, #000 3.2cqw) right / 51% 100% no-repeat" }}
          />
          <div
            className="pointer-events-none absolute inset-x-[6%] bottom-[6%] h-[36%]"
            style={{ background: primary, borderRadius: "40% 40% 1.5cqw 1.5cqw / 30% 30% 1.5cqw 1.5cqw", boxShadow: "0 -0.6cqw 1.2cqw rgba(0,0,0,.15)" }}
          >
            <div className="absolute inset-x-[8%] top-[18%] border-t-[0.6cqw] border-dashed" style={{ borderColor: bg, opacity: 0.7 }} />
          </div>
        </>
      );
      break;
    case "popup":
      body = (
        <>
          <Slot i={0} ctx={ctx} style={{ left: "8%", top: "20%", width: "38%", height: "22%", rotate: "-4deg" }} />
          <Slot i={1} ctx={ctx} style={{ left: "54%", top: "20%", width: "38%", height: "22%", rotate: "4deg" }} />
          <div className="absolute inset-x-[8%] bottom-[14%] flex items-end justify-center gap-[2%]" style={{ height: "36%" }}>
            {[55, 85, 45, 100, 65, 40].map((h, i) => (
              <div key={i} className="relative flex-1 rounded-t-[1cqw]" style={{ height: `${h}%`, background: i % 2 ? accent : primary, boxShadow: "0.8cqw 0 0 rgba(0,0,0,.12)" }}>
                <div className="absolute left-1/2 top-[14%] h-[4cqw] w-[3cqw] -translate-x-1/2 rounded-[0.5cqw] bg-white/45" />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-[6%] bottom-[13%] border-t-[0.6cqw] border-dashed" style={{ borderColor: primary }} />
        </>
      );
      break;
    case "strip":
      body = (
        <div className="absolute left-1/2 top-[20%] flex h-[70%] w-[36%] -translate-x-1/2 rotate-2 flex-col gap-[3%] bg-white p-[2.4cqw]" style={{ boxShadow: "0 0.8cqw 1.6cqw rgba(0,0,0,.18)" }}>
          {[0, 1, 2, 3].map((i) => (
            <Slot key={i} i={i} ctx={ctx} bare tint={i * 12} />
          ))}
        </div>
      );
      break;
  }

  const glyph = GLYPH[template.category];
  return (
    <div
      className={`relative aspect-[210/297] overflow-hidden rounded-lg ${className}`}
      style={{ background: bg, containerType: "inline-size" }}
      aria-hidden={onSlotClick ? undefined : true}
    >
      {/* page title, handwritten */}
      <p
        className="pointer-events-none absolute inset-x-[7%] top-[5%] truncate font-hand leading-none"
        style={{ color: primary, fontSize: "9cqw" }}
      >
        {template.name}
      </p>
      <div className="absolute left-[7%] top-[15.5%] w-[34%] border-t-[0.5cqw]" style={{ borderColor: accent }} />
      {body}
      {/* small decorations */}
      <span className="pointer-events-none absolute right-[6%] top-[5%] leading-none" style={{ color: accent, fontSize: "8cqw" }}>{glyph}</span>
      <span className="pointer-events-none absolute bottom-[4%] left-[6%] leading-none opacity-70" style={{ color: primary, fontSize: "5cqw" }}>{glyph}</span>
      <span
        className="washi pointer-events-none left-1/2 -translate-x-1/2 rotate-[-4deg]"
        style={{ ["--tape" as string]: accent, top: "-1cqw", width: "26cqw", height: "6cqw" }}
      />
    </div>
  );
}
