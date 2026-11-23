import type { Metadata } from "next";
import { VisitForm } from "./VisitForm";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Choose when you'd like to come in, then pick your pages and drinks.",
};

export default function BookPage() {
  return <VisitForm />;
}
