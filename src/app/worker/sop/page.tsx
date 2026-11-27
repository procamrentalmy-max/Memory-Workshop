import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BADGES, BRACELETS, DRINKS, HOSTING_PLANS, NFC_PRICES, PACKAGES, PASTRIES, PRICING, SHOP, STUDIO, formatRM, priceLabel,
} from "@/lib/data";
import { PrintCardButton } from "../welcome/PrintCardButton";

export const metadata: Metadata = { title: "Worker · SOP & what to say", robots: { index: false } };

const pkg = (id: string) => PACKAGES.find((p) => p.id === id)!;
const drink = (name: string) => DRINKS.find((d) => d.name === name)!;
const shopItem = (name: string) => SHOP.flatMap((g) => g.items).find((i) => i.name === name)!;
const bracelet = (name: string) => BRACELETS.find((b) => b.name === name)!;
const hosting = (name: string) => HOSTING_PLANS.find((h) => h.name === name)!;
const nfc = (name: string) => NFC_PRICES.find((n) => n.name === name)!.price;
const sen = (rm: number) => (rm < 1 ? `${Math.round(rm * 100)} sen` : formatRM(rm));

/** What staff say, in a speech bubble. */
function Say({ children }: { children: ReactNode }) {
  return (
    <blockquote className="mt-2 rounded-xl border-l-4 border-accent bg-card px-4 py-3 text-[15px] leading-relaxed shadow-sm">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-accent">Say</span>
      {children}
    </blockquote>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-line pt-6">
      <h2 className="font-display text-2xl font-semibold"><span className="mr-2 text-accent">{n}.</span>{title}</h2>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

export default function SopPage() {
  const basic30 = pkg("basic30"), basic60 = pkg("basic60"), maker = pkg("memory-maker"), complete = pkg("complete"), badge = pkg("badge");
  const h2 = hosting("2 years"), h5 = hosting("5 years"), h10 = hosting("10 years"), life = hosting("Lifetime");
  const badgePrice = BADGES.find((b) => b.name === "Badge")!.price;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <p className="font-hand text-2xl text-accent print:hidden">studio staff</p>
      <h1 className="font-display text-4xl font-semibold">SOP &amp; what to say</h1>
      <p className="mt-2 text-ink-soft">
        How we look after customers at {STUDIO.name}, and the words to use. Prices on this page always match the website.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 print:hidden">
        <Link href="/worker" className="btn btn-ghost !py-2 text-sm">Print orders</Link>
        <Link href="/worker/welcome" className="btn btn-ghost !py-2 text-sm">Welcome QR</Link>
        <PrintCardButton label="Print this page" />
      </div>

      <div className="mt-8 space-y-8">
        <Section n={1} title="When a customer arrives">
          <p>Greet every customer, then ask if it&apos;s their first visit.</p>
          <Say>Hi, welcome to {STUDIO.name}! Is it your first time here?</Say>
          <p><strong>First time:</strong> show the welcome QR (worker page, or the counter card).</p>
          <Say>
            Please scan this QR code to create your account. It only takes a minute, and you&apos;ll get a free bracelet or a free
            accordion booklet, your choice.
          </Say>
          <p>When their page opens, it shows &ldquo;Welcome gift&rdquo;. Give them the gift, then help them add the page to their home screen.</p>
          <Say>Let&apos;s add your page to your home screen, so next time you just tap the &ldquo;P&rdquo; icon and you&apos;re already logged in.</Say>
          <p><strong>Been here before:</strong></p>
          <Say>Welcome back! Just open your page from the &ldquo;P&rdquo; icon on your home screen.</Say>
          <p>
            Forgot their password? On the <Link href="/worker" className="underline">worker page</Link>, find them under Customers,
            check it&apos;s really them, and let them scan the one-time sign-in QR.
          </p>
        </Section>

        <Section n={2} title="Explaining the packages">
          <ul className="list-disc space-y-1 pl-5">
            {[basic30, basic60, maker, complete].map((p) => (
              <li key={p.id}><strong>{p.name} – {formatRM(p.price)}:</strong> {p.includes.join(", ")}.</li>
            ))}
          </ul>
          <Say>
            Basic is studio time with all our tools: {formatRM(basic30.price)} for 30 minutes or {formatRM(basic60.price)} for an hour.
            Memory Maker is {formatRM(maker.price)}: an hour, a Memory Badge that plays your video, two A5 photo prints and a bracelet.
            Complete Memory is {formatRM(complete.price)} and adds an A4 print and a 15-page scrapbook. Most people take 1.5 to 2 hours
            for Memory Maker, and 2 to 2.5 hours for Complete Memory.
          </Say>
          <p>Always mention extra time up front, so the bill is no surprise.</p>
          <Say>
            Your package includes one hour. After that there&apos;s a {PRICING.graceMinutes}-minute grace period, then it&apos;s{" "}
            {formatRM(PRICING.extraHalfHour)} for every extra 30 minutes.
          </Say>
        </Section>

        <Section n={3} title="What's free">
          <Say>
            Everything on the supply tables is free to use: cutters, ribbons, tapes and accessories, as much as you like. Water is free,
            and we bring round a pastry tasting every hour.
          </Say>
        </Section>

        <Section n={4} title="Memory Badges & video hosting">
          <p>A Memory Badge is a badge with NFC: tap it with any phone to play a video or music. No app needed.</p>
          <Say>
            The Memory Badge workshop is {formatRM(badge.price)}, and that keeps your video online for 2 years, then RM1 a month. Or you
            can get 5 years for {formatRM(h5.price)}, which is {h5.perMonth}, 10 years for {formatRM(h10.price)}, which is{" "}
            {h10.perMonth}, or just add {formatRM(life.price - h10.price)} to get lifetime, {formatRM(life.price)}.
          </Say>
          <p>If they hesitate at the longer plans:</p>
          <Say>
            If {formatRM(life.price)} feels like too big a commitment, you can just pick the 2 years first, {formatRM(h2.price)}. And if you
            don&apos;t use it anymore after that, you can simply not pay for it.
          </Say>
          <table className="w-full text-left">
            <thead className="text-ink-soft"><tr><th className="py-1 font-semibold">Hosting</th><th className="py-1 font-semibold">Price</th><th className="py-1 font-semibold">Notes</th></tr></thead>
            <tbody>
              {[h2, h5, h10, life].map((h) => (
                <tr key={h.name} className="border-t border-dashed border-line">
                  <td className="py-1.5">{h.name}</td>
                  <td className="py-1.5 font-semibold">{formatRM(h.price)}</td>
                  <td className="py-1.5 text-ink-soft">{h.note ?? h.perMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>The workshop has no studio time: they also need Basic ({formatRM(basic30.price)} for 30 minutes or {formatRM(basic60.price)} for 1 hour).</p>
          <Say>
            Each extra Memory Badge is {formatRM(badgePrice)} for the badge, plus {formatRM(nfc("Music"))} for music,{" "}
            {formatRM(nfc("Video up to 10 seconds"))} for a 10-second video, {formatRM(nfc("Video up to 30 seconds"))} for 30 seconds, or{" "}
            {formatRM(nfc("Video up to 1 minute"))} for a minute.
          </Say>
        </Section>

        <Section n={5} title="Bracelets & necklaces">
          <Say>
            Memory Maker and Complete Memory come with a bracelet. Extra bracelets are {formatRM(bracelet("Bracelet").price)}, or 2 for{" "}
            {formatRM(bracelet("2 bracelets").price)}. Necklaces are {formatRM(bracelet("Necklace").price)}.
          </Say>
        </Section>

        <Section n={6} title="Café">
          <Say>
            With your workshop, an Americano or a pot of tea with free refills is just {formatRM(drink("Americano").sessionPrice)}, and lattes
            and cappuccinos are {formatRM(drink("Latte").sessionPrice)} instead of {formatRM(drink("Latte").price!)}.
          </Say>
          <p>Pastries: {PASTRIES.map((p) => `${p.name.toLowerCase()} ${priceLabel(p)}`).join(", ")}.</p>
          <Say>Every drink at the regular price comes with a seed paper coupon: 20% off your next drink. Plant it later and it grows!</Say>
        </Section>

        <Section n={7} title="Photo prints & printing">
          <Say>
            Design your photo sheet on our website, then send it to print from your table. Extra A4 photo sheets are{" "}
            {formatRM(PRICING.photoSheet)}, and A5 photo prints are {formatRM(PRICING.a5Print)}. Plain A4 printing is{" "}
            {formatRM(shopItem("A4 colour print (plain paper)").price)} in colour or {sen(shopItem("A4 black & white print (plain paper)").price)} in
            black and white.
          </Say>
          <p>New prints show on the <Link href="/worker" className="underline">worker page</Link>: download the PDF and print at actual size on A4.</p>
        </Section>

        <Section n={8} title="When they leave">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Check their arrival time and add any extra time ({formatRM(PRICING.extraHalfHour)} per 30 minutes after the {PRICING.graceMinutes}-minute grace).</li>
            <li>Add extra prints, badges, bracelets, café items and any longer video hosting to the bill.</li>
            <li>After they pay, press <strong>Bill settled</strong> on the worker page: their photos are deleted straight away.</li>
          </ol>
          <Say>Thank you for coming! Your Memory Badge video is on your page whenever you want to watch it. See you again soon.</Say>
        </Section>
      </div>
    </div>
  );
}
