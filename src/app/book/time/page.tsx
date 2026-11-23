import type { Metadata } from "next";
import { VisitForm } from "../VisitForm";

export const metadata: Metadata = {
  title: "Choose Your Time",
  description: "Choose the day and time you'd like to come in.",
};

export default function TimeStep() {
  return <VisitForm />;
}
