import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { customerBadges, customerOrders, formatPhone, getSession } from "@/lib/accounts";
import { STUDIO, formatRM } from "@/lib/data";
import { lengthLabel } from "@/lib/tagFormat";
import { logOut } from "./actions";
import { HomeScreenSteps } from "./HomeScreenSteps";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = {
  title: "My page",
  robots: { index: false },
  appleWebApp: { capable: true, title: STUDIO.name, statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#faf6ef" };

const KL = "Asia/Kuala_Lumpur";
const day = (iso: string) => new Date(iso).toLocaleDateString("en-MY", { timeZone: KL, day: "numeric", month: "short", year: "numeric" });

const ACTIONS = [
  { href: "/collage", title: "Make photo prints", text: "Design a sheet and send it to print" },
  { href: "/book", title: "Book a session", text: "Choose a package and a time" },
  { href: "/pricing", title: "Prices", text: "Packages, badges and prints" },
  { href: "/shop", title: "Shop & café", text: "Drinks, pastries and supplies" },
];

export default function MePage(props: PageProps<"/me">) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      {/* Fetched with the login cookie, so the home screen icon opens this customer's page already logged in. */}
      <link rel="manifest" href="/me/manifest" crossOrigin="use-credentials" />
      <Suspense fallback={<p className="pt-6 text-ink-soft">Opening your page…</p>}>
        <MyPage searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function MyPage({ searchParams }: { searchParams: PageProps<"/me">["searchParams"] }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/me");
  const params = await searchParams;
  const welcome = params.welcome === "1";
  const { customer } = session;
  const [badges, orders] = await Promise.all([customerBadges(customer.id), customerOrders(customer.id)]);
  const firstName = customer.name.split(" ")[0];
  // A free bracelet for a new account made on arrival: shown on the day the account was created.
  const klDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: KL });
  const newToday = klDay(new Date(customer.createdAt)) === klDay(new Date());

  return (
    <>
      <p className="font-hand text-2xl text-accent">{welcome ? "your account is ready" : "welcome back"}</p>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Hi, {firstName}</h1>

      {newToday && (
        <section className="mt-6 rounded-2xl bg-mustard/20 p-5 ring-1 ring-mustard/50">
          <h2 className="font-display text-xl font-semibold">Welcome gift: a free bracelet</h2>
          <p className="mt-1 text-sm">Show this to our staff at the counter to make your free bracelet.</p>
        </section>
      )}

      {params.password === "saved" && (
        <p role="status" className="mt-6 rounded-2xl bg-sage/20 px-5 py-3 font-semibold text-[#3f5e41]">Your new password is saved.</p>
      )}

      {session.canResetPassword && (
        <section className="mt-6 rounded-2xl bg-card p-6 shadow-sm ring-2 ring-mustard/60">
          <h2 className="font-display text-xl font-semibold">Set a new password</h2>
          <p className="mt-1 text-sm text-ink-soft">Our staff signed you in. Choose a new password so you can log in yourself next time.</p>
          <PasswordForm reset />
        </section>
      )}

      <HomeScreenSteps welcome={welcome} />

      <nav aria-label="Things to do" className="mt-6 grid grid-cols-2 gap-3">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="rounded-2xl bg-card p-4 shadow-sm transition-colors hover:bg-paper-2">
            <span className="block font-semibold">{a.title}</span>
            <span className="mt-0.5 block text-xs text-ink-soft">{a.text}</span>
          </Link>
        ))}
      </nav>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Your Memory Badges</h2>
        {badges.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            Memory Badges you set up while logged in show here, so you can watch or change their videos any time.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-dashed divide-line rounded-2xl bg-card px-5 shadow-sm">
            {badges.map((b, i) => (
              <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block font-semibold">Memory Badge {badges.length - i}</span>
                  <span className="block text-xs text-ink-soft">
                    {b.hasVideo ? `Video up to ${lengthLabel(b.maxSeconds)} · played ${b.views} ${b.views === 1 ? "time" : "times"}` : "No video yet"}
                  </span>
                </span>
                <Link href={`/v/${b.id}`} className="btn btn-ghost !px-4 !py-1.5 text-sm">{b.hasVideo ? "Open" : "Add a video"}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Your orders</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Prints you send and sessions you book while logged in show here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-dashed divide-line rounded-2xl bg-card px-5 text-sm shadow-sm">
            {orders.map((o) => (
              <li key={o.reference} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <span>
                  <span className="font-semibold">{o.walkIn ? "Prints at the studio" : "Booking"}</span>{" "}
                  <span className="font-mono text-xs text-ink-soft">{o.reference}</span>
                  <span className="block text-xs text-ink-soft">{o.walkIn ? `Sent ${day(o.createdAt)}` : o.visitDate ? `Visit ${day(`${o.visitDate}T12:00:00+08:00`)}` : day(o.createdAt)}</span>
                </span>
                <span className="text-right">
                  <span className="font-semibold">{formatRM(o.total)}</span>
                  <span className="block text-xs text-ink-soft">{o.settled ? "Paid" : "Pay at the studio"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-2xl bg-paper-2 p-6 text-sm">
        <h2 className="font-display text-xl font-semibold">Your account</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-ink-soft">Name</dt>
          <dd className="font-semibold">{customer.name}</dd>
          <dt className="text-ink-soft">Mobile</dt>
          <dd className="font-semibold">{formatPhone(customer.phone)}</dd>
          <dt className="text-ink-soft">Member since</dt>
          <dd>{day(customer.createdAt)}</dd>
        </dl>
        {!session.canResetPassword && (
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">Change password</summary>
            <PasswordForm reset={false} />
          </details>
        )}
        <form action={logOut} className="mt-5">
          <button type="submit" className="btn btn-ghost !py-2 text-sm">Log out</button>
          <p className="mt-2 text-xs text-ink-soft">Logging out signs you out everywhere, including the home screen icon.</p>
        </form>
      </section>
    </>
  );
}
