import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { STUDIO } from "@/lib/data";
import { qrSvg, siteBase } from "@/lib/siteUrl";
import { PrintCardButton } from "./PrintCardButton";

export const metadata: Metadata = { title: "Worker · Welcome QR", robots: { index: false } };

/** Shown (or printed as a counter card) for a customer's first visit: scan to create an account. */
export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 print:pt-0">
      <div className="print:hidden">
        <p className="font-hand text-2xl text-accent">studio staff</p>
        <h1 className="font-display text-4xl font-semibold">Welcome QR</h1>
        <p className="mt-2 text-ink-soft">
          For a customer&apos;s first visit. <Link href="/worker" className="underline">Back to print orders</Link>
        </p>
      </div>
      <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] print:block">
        <Suspense fallback={<div className="aspect-square rounded-2xl bg-card" />}>
          <WelcomeCard />
        </Suspense>
        <section className="rounded-2xl bg-paper-2 p-6 print:hidden">
          <h2 className="font-display text-2xl font-semibold">Walk-in steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
            <li><strong>Greet</strong> the customer.</li>
            <li>Ask: <strong>&ldquo;Is it your first time here?&rdquo;</strong></li>
            <li>
              <strong>First time:</strong> ask them to scan this QR code with their phone camera and create an account (their
              name, mobile number and a password).
            </li>
            <li>
              When their page opens, help them <strong>add it to their home screen</strong>. The page shows the steps:
              <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">
                <li>iPhone (Safari): Share button → Add to Home Screen → Add.</li>
                <li>Android (Chrome): the Add to home screen button, or ⋮ menu → Add to home screen.</li>
              </ul>
            </li>
            <li>
              From now on the <strong>&ldquo;P&rdquo; icon</strong> on their home screen opens their page, already logged in. They
              stay logged in.
            </li>
            <li>
              <strong>Been here before:</strong> ask them to open their page from the icon. Forgot their password? Find them under
              Customers on the <Link href="/worker" className="underline">worker page</Link> and make a sign-in QR.
            </li>
          </ol>
          <div className="mt-5">
            <PrintCardButton />
          </div>
        </section>
      </div>
    </div>
  );
}

async function WelcomeCard() {
  await connection();
  const url = `${await siteBase()}/join`;
  const svg = await qrSvg(url);
  return (
    <section className="rounded-2xl bg-card p-8 text-center shadow-sm print:mx-auto print:max-w-md print:shadow-none">
      <p className="font-hand text-3xl text-accent">welcome to {STUDIO.name}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold">New here? Scan me</h2>
      <div className="mx-auto mt-5 w-64 max-w-full [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label="QR code to create an account" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="mt-4 text-sm text-ink-soft">Create your account, then add your page to your home screen.</p>
      <p className="mt-2 break-all font-mono text-xs text-ink-soft">{url.replace(/^https?:\/\//, "")}</p>
    </section>
  );
}
