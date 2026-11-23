import type { Metadata } from "next";
import { Fraunces, Nunito_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { STUDIO } from "@/lib/data";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"] });
const body = Nunito_Sans({ variable: "--font-body", subsets: ["latin"] });
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { siteName: STUDIO.name, locale: "en_MY", type: "website" },
  title: {
    default: `${STUDIO.name} — Memory Creation Studio`,
    template: `%s · ${STUDIO.name}`,
  },
  description:
    "Turn your photos, tickets and souvenirs into handmade keepsakes. Book a hands-on scrapbooking session for couples, friends and families.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${hand.variable} h-full antialiased`}
    >
      <body className="paper-grain flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
