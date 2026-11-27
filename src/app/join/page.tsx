import type { Metadata } from "next";
import { STUDIO } from "@/lib/data";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: `Create your ${STUDIO.name} account: your Memory Badges, prints and bookings in one place, right on your home screen.`,
};

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-10 sm:px-6">
      <p className="font-hand text-2xl text-accent">welcome to {STUDIO.name}</p>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Create your account</h1>
      <p className="mt-3 text-ink-soft">
        It takes a minute. Your account keeps your Memory Badges, prints and bookings together, and opens straight from
        your home screen.
      </p>
      <p className="mt-3 rounded-xl bg-mustard/20 px-4 py-2.5 text-sm font-semibold">
        Creating your account at the studio? Show your new page to our staff and get a free bracelet.
      </p>
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <JoinForm />
      </div>
    </div>
  );
}
