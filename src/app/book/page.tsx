import type { Metadata } from "next";
import { PackagesStep } from "./PackagesStep";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Choose your workshop package: Basic from RM8, Memory Maker RM21, Complete Memory RM35, or the Memory Badge workshop RM15.",
};

export default function PackagesStepPage() {
  return <PackagesStep />;
}
