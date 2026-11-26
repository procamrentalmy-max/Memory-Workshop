import Link from "next/link";
import { BADGES, DRINKS, EXTRA_TIME_RULE, FAQS, PACKAGES, PRICING, formatRM } from "@/lib/data";

const STEPS = [
  { n: "01", title: "Choose your package", text: "From a quick 30 minutes to a full scrapbook, and design your photo prints online." },
  { n: "02", title: "Choose your time", text: "Choose the day and time you'd like to come in." },
  { n: "03", title: "Choose your drink", text: "Add a coffee to your workshop for less, ready for when you arrive." },
  { n: "04", title: "Excited to see you!", text: "Bring your favourite people. We'll have everything ready." },
];

const AUDIENCES = [
  { title: "Couples", text: "A date night with a difference. Relive your first trip, your anniversary or all the little moments in between.", tape: "#c4553a" },
  { title: "Friends", text: "Concert tickets, photobooth strips and inside jokes. Turn the group chat's best moments into something real.", tape: "#e0a93b" },
  { title: "Families", text: "From baby's firsts to grandparents' stories, an afternoon that every generation can enjoy together.", tape: "#7d9a7e" },
];

const cheapestDrink = Math.min(...DRINKS.map((d) => d.sessionPrice));
const cheapestPackage = Math.min(...PACKAGES.map((p) => p.price));
const cheapestNfc = Math.min(...BADGES.filter((b) => b.name.includes("NFC")).map((b) => b.price));

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:pt-20">
        <div>
          <p className="font-hand text-2xl text-accent">a hands-on memory creation studio</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sage/20 px-3 py-1 text-sm font-semibold text-[#3f5e41] ring-1 ring-sage/40">
            <span aria-hidden>✂</span> Free stickers, stationery, snacks &amp; water
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Turn your favourite moments into keepsakes you made yourself.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Bring your photos, tickets and souvenirs. Pick a prepared design and make it yourself: scrapbook pages, photo
            prints and NFC badges that play your video. Workshops from {formatRM(cheapestPackage)}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="btn btn-primary">Book a Session</Link>
            <Link href="/collage" className="btn btn-ghost">Design your photo prints</Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-sm text-ink-soft">Workshops from</dt>
              <dd className="font-display text-2xl font-semibold">{formatRM(cheapestPackage)}<span className="text-base font-normal text-ink-soft"> /person</span></dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Extra 30 minutes</dt>
              <dd className="font-display text-2xl font-semibold">{formatRM(PRICING.extraHalfHour)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Snacks &amp; water</dt>
              <dd className="font-display text-2xl font-semibold text-[#3f5e41]">Free flow</dd>
            </div>
          </dl>
        </div>

        {/* What's included, as a ticket */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative rotate-[-2deg] rounded-2xl bg-card p-7 pt-9 shadow-xl">
            <span className="washi -top-2 left-8 -rotate-3" style={{ ["--tape" as string]: "#c4553a" }} />
            <span className="washi -top-2 right-6 rotate-6" style={{ ["--tape" as string]: "#7d9a7e" }} />
            <p className="font-hand text-2xl text-accent">our workshops</p>
            <ul className="mt-2 divide-y divide-dashed divide-line">
              {PACKAGES.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span>
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-xs text-ink-soft">{p.includes.filter((x) => !x.startsWith("Shared")).join(" · ")}</span>
                  </span>
                  <span className="font-display text-xl font-semibold">{formatRM(p.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-dashed border-line pt-3 text-xs text-ink-soft">{EXTRA_TIME_RULE}</p>
          </div>
          <p className="absolute -bottom-6 right-2 rotate-[-4deg] font-hand text-2xl text-ink-soft">made by you ✂</p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-paper-2/70 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">How it works</h2>
          <p className="mt-2 text-ink-soft">Booking takes a couple of minutes.</p>
          <ol className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="cut-line rounded-xl bg-card p-4 sm:p-6">
                <span className="font-hand text-2xl text-accent sm:text-3xl">{s.n}</span>
                <h3 className="mt-1 font-display text-lg font-semibold leading-tight sm:mt-2 sm:text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Photo prints */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Your photos, printed</h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Memory Maker and Complete Memory include photo prints you design yourself on our website: split an A4 sheet into
              two A5 prints, make a grid, or draw circles, hearts and stars and fill them with your photos. We print it, you
              stick it in.
            </p>
            <Link href="/collage" className="btn btn-primary mt-6">Design your photo prints</Link>
          </div>
          <div className="flex justify-center gap-4" aria-hidden>
            <div className="aspect-[210/297] w-28 -rotate-3 rounded-md bg-white p-1.5 shadow-lg sm:w-32">
              <div className="grid h-full grid-rows-2 gap-1">
                <div className="rounded-sm bg-[linear-gradient(160deg,#9cc7d8,#f2d4a5)]" />
                <div className="rounded-sm bg-[linear-gradient(160deg,#e5989b,#6d6875)]" />
              </div>
            </div>
            <div className="relative aspect-[210/297] w-28 rotate-3 rounded-md bg-white shadow-lg sm:w-32">
              <span className="absolute left-[18%] top-[12%] h-[34%] w-[64%] rounded-full bg-[linear-gradient(160deg,#7d9a7e,#e0a93b)]" />
              <span className="absolute bottom-[10%] left-[14%] h-[30%] w-[44%] rounded-xl bg-[linear-gradient(160deg,#c4553a,#e0a93b)]" />
              <span className="absolute bottom-[14%] right-[10%] h-[22%] w-[30%] rotate-12 bg-[linear-gradient(160deg,#3d5a80,#98c1d9)] [clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* NFC badges */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="cut-line grid gap-6 rounded-2xl bg-card p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <span className="rounded-full bg-sage/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#3f5e41]">New</span>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Badges that play your video</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Add a badge with a tiny NFC tag inside. Tap it with any phone to play your music or a video of up to 30 seconds,
              no app needed. From {formatRM(cheapestNfc)}, or join a Badge workshop for {formatRM(PACKAGES.find((p) => p.id === "badge")!.price)}
              with one NFC tag free.
            </p>
          </div>
          <Link href="/shop" className="btn btn-ghost">See badges</Link>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Made for making together</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <div
              key={a.title}
              className={`relative rounded-xl bg-card p-7 pt-9 shadow-sm ${i === 1 ? "md:rotate-1" : i === 2 ? "md:-rotate-1" : ""}`}
            >
              <span className="washi -top-2 left-6 -rotate-3" style={{ ["--tape" as string]: a.tape }} />
              <h3 className="font-display text-2xl font-semibold">{a.title}</h3>
              <p className="mt-2 text-ink-soft">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop & cafe */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 rounded-2xl bg-ink p-8 text-paper md:grid-cols-2 md:p-12">
          <div>
            <p className="font-hand text-2xl text-mustard">while you create…</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Shop &amp; café</h2>
            <p className="mt-3 text-paper/80">
              Papers, stickers, ribbons and cutters are yours to use, with free-flow snacks and water. Add a coffee to your
              workshop from {formatRM(cheapestDrink)}, try a pastry, and take home a badge or two.
            </p>
            <Link href="/shop" className="btn mt-6 bg-paper text-ink hover:bg-white">Visit the shop &amp; café</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {([["Stickers & ribbons", true], ["Papers & cutters", true], ["Snacks & water", true], ["Coffee & matcha", false], ["Pastries", false], ["Badges & NFC", false]] as const).map(([x, free]) => (
              <li key={x} className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 ${free ? "border-mustard/60" : "border-paper/20"}`}>
                {x}
                {free && <span className="rounded-full bg-mustard px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">Free</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-xl text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-6xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ready to make something you&apos;ll keep?</h2>
        <p className="mt-3 text-ink-soft">Gather your people and your favourite photos. We&apos;ll handle the rest.</p>
        <Link href="/book" className="btn btn-primary mt-6">Book a Session</Link>
      </section>
    </>
  );
}
