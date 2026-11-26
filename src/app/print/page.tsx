import type { Metadata } from "next";
import { PhotoKeepAlive } from "../book/PhotoKeepAlive";
import { PrintOrder } from "./PrintOrder";

export const metadata: Metadata = {
  title: "Send to print",
  description: "Send your photo pages to the studio's printer.",
  robots: { index: false },
};

export default function PrintPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <PhotoKeepAlive />
      <p className="font-hand text-2xl text-accent">at the studio</p>
      <h1 className="font-display text-4xl font-semibold">Send to print</h1>
      <PrintOrder />
    </div>
  );
}
