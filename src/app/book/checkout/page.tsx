import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Details & Payment" };

export default function CheckoutPage() {
  return <CheckoutForm />;
}
