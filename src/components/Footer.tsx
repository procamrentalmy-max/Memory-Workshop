import Link from "next/link";
import { STUDIO } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-semibold">{STUDIO.name}</p>
          <p className="mt-2 max-w-sm text-ink-soft">
            A hands-on memory creation studio. Bring your photos, tickets and stories, and leave with
            keepsakes you made yourself.
          </p>
          <p className="mt-4 font-hand text-2xl text-accent">Make it. Keep it. Forever.</p>
        </div>
        <div>
          <p className="font-semibold">Visit</p>
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            <li>{STUDIO.address}</li>
            <li>{STUDIO.hours}</li>
            <li>
              <a className="hover:text-accent" href={`mailto:${STUDIO.email}`}>
                {STUDIO.email}
              </a>
            </li>
            <li>{STUDIO.phone}</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Explore</p>
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            <li><Link className="hover:text-accent" href="/pricing">Pricing</Link></li>
            <li><Link className="hover:text-accent" href="/collage">Photo prints</Link></li>
            <li><Link className="hover:text-accent" href="/shop">Shop &amp; café</Link></li>
            <li><Link className="hover:text-accent" href="/book">Book a session</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-ink-soft">
        © 2026 {STUDIO.name}. All rights reserved.
      </p>
    </footer>
  );
}
