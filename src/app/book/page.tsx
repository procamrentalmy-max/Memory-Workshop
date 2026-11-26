import type { Metadata } from "next";
import { PhotosStep } from "./PhotosStep";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Book a 1-hour memory-making session: a scrapbook, a Memory Badge, unlimited stationery, 2 photo prints and free-flow snacks for RM24.",
};

export default function PhotosStepPage() {
  return <PhotosStep />;
}
