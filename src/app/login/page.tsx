import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-10 sm:px-6">
      <p className="font-hand text-2xl text-accent">welcome back</p>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Log in</h1>
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
