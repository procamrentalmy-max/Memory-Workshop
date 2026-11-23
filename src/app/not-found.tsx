import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-hand text-3xl text-accent">oops, this page got lost in the scrapbook</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Back to home</Link>
        <Link href="/templates" className="btn btn-ghost">Browse pages</Link>
      </div>
    </div>
  );
}
