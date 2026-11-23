import Link from "next/link";
import { FAQS, PRICING, TEMPLATES, formatRM } from "@/lib/data";
import { TemplateCard } from "@/components/TemplateCard";
import { TemplatePreview } from "@/components/TemplatePreview";

const STEPS = [
  { n: "01", title: "Book a time", text: "Choose the day and time you'd like to come in." },
  { n: "02", title: "Choose your pages", text: "Pick from our ready-made pages, or design your own with drag and drop." },
  { n: "03", title: "Choose your drink", text: "Pick a coffee or something refreshing, ready for when you arrive." },
  { n: "04", title: "Excited to see you!", text: "Bring your photos and your favourite people. We'll have everything ready." },
];

const AUDIENCES = [
  { title: "Couples", text: "A date night with a difference. Relive your first trip, your anniversary or all the little moments in between.", tape: "#c4553a" },
  { title: "Friends", text: "Concert tickets, photobooth strips and inside jokes. Turn the group chat's best moments into something real.", tape: "#e0a93b" },
  { title: "Families", text: "From baby's firsts to grandparents' stories, an afternoon that every generation can enjoy together.", tape: "#7d9a7e" },
];

export default function Home() {
  const featured = ["passport-stamps", "our-first-date", "photobooth-strip", "family-tree"]
    .map((id) => TEMPLATES.find((t) => t.id === id)!)
    .filter(Boolean);
  const heroPages = ["postcard-wall", "heart-popup", "concert-night"].map((id) => TEMPLATES.find((t) => t.id === id)!);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:pt-20">
        <div>
          <p className="font-hand text-2xl text-accent">a hands-on memory creation studio</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Turn your favourite moments into keepsakes you made yourself.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Bring your photos, travel souvenirs and ticket stubs. Choose a ready-made page or design your
            own, and leave with something to keep forever.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="btn btn-primary">Book a Session</Link>
            <Link href="/templates" className="btn btn-ghost">Browse Pages</Link>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-sm text-ink-soft">Studio session</dt>
              <dd className="font-display text-2xl font-semibold">{formatRM(PRICING.sessionPerPersonPerHour)}<span className="text-base font-normal text-ink-soft"> /person/hr</span></dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Ready-made pages</dt>
              <dd className="font-display text-2xl font-semibold">{formatRM(PRICING.perPage)}<span className="text-base font-normal text-ink-soft"> or design your own</span></dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto h-[340px] w-full max-w-[340px] sm:h-[480px] sm:max-w-md">
          <div className="absolute left-0 top-6 w-[58%] -rotate-6 rounded-xl bg-white p-2 shadow-lg">
            <TemplatePreview template={heroPages[0]} />
          </div>
          <div className="absolute right-0 top-0 w-[52%] rotate-[5deg] rounded-xl bg-white p-2 shadow-lg">
            <TemplatePreview template={heroPages[1]} />
          </div>
          <div className="absolute bottom-0 left-[22%] w-[52%] rotate-[-1deg] rounded-xl bg-white p-2 shadow-xl">
            <TemplatePreview template={heroPages[2]} />
          </div>
          <p className="absolute -bottom-2 right-0 rotate-[-4deg] font-hand text-2xl text-ink-soft">made by you ✂</p>
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

      {/* Featured templates */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Pages our guests love</h2>
            <p className="mt-2 text-ink-soft">
              Pop-ups, pockets, fold-outs and flaps, each one {formatRM(PRICING.perPage)} with everything included.
            </p>
          </div>
          <Link href="/templates" className="font-semibold text-accent hover:underline">
            See all {TEMPLATES.length} pages →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-4">
          {featured.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
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
              Add the finishing touches with stickers, washi tape and stationery, take your pages home in a
              notebook or scrapbook album, and enjoy a fresh coffee while you work.
            </p>
            <Link href="/shop" className="btn mt-6 bg-paper text-ink hover:bg-white">Visit the shop</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {["Stickers", "Washi tape", "Stationery", "Notebooks", "Scrapbook albums", "Coffee & drinks"].map((x) => (
              <li key={x} className="rounded-lg border border-paper/20 px-4 py-3">{x}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Design your own */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="cut-line grid gap-6 rounded-2xl bg-card p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <span className="rounded-full bg-sage/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#3f5e41]">New</span>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Design your own page</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Prefer your own layout? Drag and drop stickers and elements onto a blank page, add coloured
              sections and text boxes for free, and we&apos;ll have it ready for your visit.
            </p>
          </div>
          <Link href="/book/pages?mode=custom" className="btn btn-ghost">Start designing</Link>
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
