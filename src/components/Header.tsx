"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { STUDIO } from "@/lib/data";

const NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/collage", label: "Photo Prints" },
  { href: "/shop", label: "Shop & Café" },
  { href: "/me", label: "My page" },
];

/** Desktop links; the current page is highlighted. */
function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className={`text-sm font-semibold transition-colors hover:text-accent ${pathname === item.href ? "text-accent" : "text-ink"}`}
    >
      {item.label}
    </Link>
  ));
}

// Reading the address needs Suspense on pages whose address varies (such as /v/<tag>).
function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span
            aria-hidden
            className="grid h-9 w-9 rotate-[-6deg] place-items-center rounded-md bg-accent font-display text-lg font-bold text-accent-ink shadow-sm"
          >
            P
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">{STUDIO.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          <Suspense fallback={<NavLinks pathname={null} />}>
            <CurrentNavLinks />
          </Suspense>
          <Link href="/book" className="btn btn-primary !py-2 text-sm">
            Book a Session
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-md p-2 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper px-4 pb-4 lg:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 font-semibold"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/book" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">
            Book a Session
          </Link>
        </nav>
      )}
    </header>
  );
}
