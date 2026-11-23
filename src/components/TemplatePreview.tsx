import type { Category, Template } from "@/lib/data";

/**
 * Illustrated preview of a scrapbook page, drawn with CSS only. Sizes use container units (cqw),
 * so the same preview works as a large hero and as a tiny thumbnail.
 * Replace with real photos of finished pages later (e.g. /public/templates/<id>.jpg).
 */

// "︎" asks for the plain text glyph rather than a colour emoji.
const GLYPH: Record<Category, string> = {
  Travel: "✈︎",
  Couples: "♥︎",
  Friends: "★",
  Family: "✿",
  Celebrations: "✦",
  Everyday: "☼",
};

function Photo({ primary, accent, style, className = "", caption = false }: {
  primary: string; accent: string; style?: React.CSSProperties; className?: string; caption?: boolean;
}) {
  return (
    <div
      className={`absolute bg-white ${className}`}
      style={{ padding: "1.6cqw", paddingBottom: caption ? "6cqw" : "1.6cqw", boxShadow: "0 0.6cqw 1.4cqw rgba(0,0,0,.18)", ...style }}
    >
      <div
        className="h-full w-full"
        style={{
          background: `radial-gradient(circle at 72% 28%, rgba(255,255,255,.6) 0 9%, transparent 10%),
            radial-gradient(ellipse 90% 50% at 25% 105%, rgba(0,0,0,.22) 98%, transparent 100%),
            radial-gradient(ellipse 80% 40% at 85% 110%, rgba(0,0,0,.14) 98%, transparent 100%),
            linear-gradient(165deg, ${accent}, ${primary})`,
        }}
      />
    </div>
  );
}

export function TemplatePreview({ template, className = "" }: { template: Template; className?: string }) {
  const [bg, primary, accent] = template.palette;
  const P = (style: React.CSSProperties, caption = false, cls = "") => (
    <Photo primary={primary} accent={accent} style={style} caption={caption} className={cls} />
  );

  let body: React.ReactNode;
  switch (template.layout) {
    case "grid":
      body = (
        <>
          {P({ left: "8%", top: "22%", width: "40%", height: "30%" })}
          {P({ left: "52%", top: "22%", width: "40%", height: "30%" })}
          {P({ left: "8%", top: "55%", width: "40%", height: "30%" })}
          {P({ left: "52%", top: "55%", width: "40%", height: "30%" })}
        </>
      );
      break;
    case "polaroid":
      body = (
        <>
          {P({ left: "7%", top: "24%", width: "50%", height: "44%", rotate: "-7deg" }, true)}
          {P({ left: "43%", top: "38%", width: "50%", height: "44%", rotate: "6deg" }, true)}
        </>
      );
      break;
    case "collage":
      body = (
        <>
          {P({ left: "7%", top: "22%", width: "56%", height: "42%" })}
          {P({ left: "66%", top: "22%", width: "27%", height: "20%" })}
          {P({ left: "66%", top: "44%", width: "27%", height: "20%" })}
          {P({ left: "7%", top: "67%", width: "40%", height: "20%" })}
          {P({ left: "50%", top: "67%", width: "43%", height: "20%" })}
        </>
      );
      break;
    case "pocket":
      body = (
        <>
          {P({ left: "12%", top: "21%", width: "56%", height: "34%", rotate: "-4deg" })}
          {/* ticket peeking out of the pocket */}
          <div
            className="absolute"
            style={{ right: "12%", top: "44%", width: "34%", height: "16%", rotate: "10deg", background: accent, borderRadius: "1cqw",
              WebkitMask: "radial-gradient(circle at 0 50%, transparent 3cqw, #000 3.2cqw) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 3cqw, #000 3.2cqw) right / 51% 100% no-repeat" }}
          />
          <div
            className="absolute inset-x-[6%] bottom-[6%] h-[36%]"
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
          <div className="absolute inset-x-[8%] bottom-[14%] flex items-end justify-center gap-[2%]" style={{ height: "52%" }}>
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
            <div key={i} className="flex-1" style={{ background: `radial-gradient(circle at 70% 30%, rgba(255,255,255,.55) 0 10%, transparent 11%), linear-gradient(165deg, ${accent}, ${primary})`, filter: `hue-rotate(${i * 12}deg)` }} />
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
      aria-hidden
    >
      {/* page title, handwritten */}
      <p
        className="absolute inset-x-[7%] top-[5%] truncate font-hand leading-none"
        style={{ color: primary, fontSize: "9cqw" }}
      >
        {template.name}
      </p>
      <div className="absolute left-[7%] top-[15.5%] w-[34%] border-t-[0.5cqw]" style={{ borderColor: accent }} />
      {body}
      {/* small decorations */}
      <span className="absolute right-[6%] top-[5%] leading-none" style={{ color: accent, fontSize: "8cqw" }}>{glyph}</span>
      <span className="absolute bottom-[4%] left-[6%] leading-none opacity-70" style={{ color: primary, fontSize: "5cqw" }}>{glyph}</span>
      <span
        className="washi left-1/2 -translate-x-1/2 rotate-[-4deg]"
        style={{ ["--tape" as string]: accent, top: "-1cqw", width: "26cqw", height: "6cqw" }}
      />
    </div>
  );
}
