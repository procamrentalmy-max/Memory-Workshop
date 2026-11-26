"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrder } from "./orderStore";

export const STEPS = [
  { href: "/book", label: "Photo prints" },
  { href: "/book/time", label: "Choose your time" },
  { href: "/book/drinks", label: "Choose a drink" },
  { href: "/book/checkout", label: "Details & payment" },
];

export function Stepper() {
  const pathname = usePathname();
  const order = useOrder();
  const current = Math.max(0, STEPS.findIndex((s) => s.href === pathname));
  // A step is ticked only when it has really been completed.
  const done = [
    (order?.pages.length ?? 0) > 0,
    Boolean(order?.visit),
    current > 2 || Object.keys(order?.drinks ?? {}).length > 0,
    false,
  ];

  return (
    <nav aria-label="Booking steps">
      {/* Phone: compact progress */}
      <div className="sm:hidden">
        <p className="text-sm font-semibold">
          Step {current + 1} of {STEPS.length} <span className="font-normal text-ink-soft">· {STEPS[current].label}</span>
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.href} className={`h-1.5 rounded-full ${i < current || done[i] ? "bg-sage" : i === current ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
      </div>

      {/* Larger screens: clickable steps */}
      <ol className="hidden flex-wrap gap-2 text-sm sm:flex">
        {STEPS.map((s, i) => {
          const state = i === current ? "current" : done[i] ? "done" : "todo";
          return (
            <li key={s.href} className="flex items-center gap-2">
              <Link
                href={s.href}
                aria-current={state === "current" ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold transition-colors ${
                  state === "current" ? "border-ink bg-ink text-paper" : state === "done" ? "border-sage bg-sage/15 text-[#3f5e41]" : "border-line bg-card text-ink-soft hover:border-ink"
                }`}
              >
                <span>{state === "done" ? "✓" : i + 1}</span>
                {s.label}
              </Link>
              {i < STEPS.length - 1 && <span className="text-line" aria-hidden>—</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
