// Central business data. Edit prices and products here.

export const STUDIO = {
  name: "Paper & Moments",
  tagline: "A hands-on memory creation studio",
  email: "hello@paperandmoments.my",
  phone: "+60 12-345 6789",
  address: "Kuala Lumpur, Malaysia",
  hours: "Tue – Sun · 10:00 am – 10:00 pm",
};

export const PRICING = {
  extraHalfHour: 7, // RM for each 30-minute block started after the grace period
  graceMinutes: 10, // free minutes after a package's included time
  photoSheet: 2.8, // RM per extra A4 photo sheet (an A4 photo print), beyond those in the packages
  a5Print: 1.8, // RM, a single A5 photo print
  a4Print: 2.8, // RM, a single A4 photo print
  currency: "RM",
};

export type PackageId = "basic30" | "basic60" | "memory-maker" | "complete" | "badge";
export type Package = {
  id: PackageId;
  name: string;
  price: number; // RM per person
  includes: string[];
  sheets: number; // A4 photo sheets included (2 A5 prints = 1 sheet)
  typical?: string; // how long most guests take
  note?: string;
};

/** Workshop packages, one per person. */
export const PACKAGES: Package[] = [
  { id: "basic30", name: "Basic – 30 minutes", price: 8, sheets: 0, includes: ["30 minutes in the studio", "Shared tools, stationery and stickers"] },
  { id: "basic60", name: "Basic – 1 hour", price: 14, sheets: 0, includes: ["1 hour in the studio", "Shared tools, stationery and stickers"] },
  {
    id: "memory-maker", name: "Memory Maker", price: 21, sheets: 1, typical: "Most guests take 1.5–2 hours",
    includes: ["1 hour in the studio", "1 NFC badge", "2 A5 photo prints"],
  },
  {
    id: "complete", name: "Complete Memory", price: 35, sheets: 2, typical: "Most guests take 2–2.5 hours",
    includes: ["1 hour in the studio", "1 NFC badge", "2 A5 photo prints and 1 A4 print", "15-page scrapbook"],
  },
  {
    id: "badge", name: "Badge workshop", price: 15, sheets: 0,
    includes: ["Make your own badge", "1 NFC tag free"], note: "More NFC badges at the usual badge prices",
  },
];
export const PACKAGE_IDS = PACKAGES.map((p) => p.id);
export const packageById = (id: string) => PACKAGES.find((p) => p.id === id);

/** Packages include 1 hour (used for calendar invites and, later, seating). */
export const SESSION_HOURS = 1;

/** Extra time, in plain words. */
export const EXTRA_TIME_RULE = `After a ${PRICING.graceMinutes}-minute grace period, extra time is RM${PRICING.extraHalfHour} for every 30 minutes.`;

/** Seating capacity. Set once the studio layout is known; null = no limit enforced yet. */
export const SEATING: { seats: number | null } = { seats: null };

/** Arrival times every 30 min; the last arrival leaves time for a 1-hour package before 10 pm. */
export const ARRIVAL_TIMES = Array.from({ length: 23 }, (_, i) => {
  const mins = 10 * 60 + i * 30; // 10:00 … 21:00
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${mins % 60 === 0 ? "00" : "30"}`;
});

export function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

export function formatRM(amount: number) {
  return `RM${amount.toLocaleString("en-MY", {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export type Product = {
  name: string;
  price: number;
  note?: string;
};

/** Free to use, as much as you like, during every session. */
export const FREE_SUPPLIES: { group: string; items: string[] }[] = [
  { group: "Papers & stickers", items: ["Decorative and textured papers", "Themed sticker sheets", "Ribbons", "Washi tape"] },
  { group: "Tools & accessories", items: ["Cutters and corner punches", "Gel pens in every colour", "Stamps", "Embellishments and accessories"] },
];

/** Badges and NFC tags (tap with a phone to play music or a video). */
export const BADGES: Product[] = [
  { name: "Badge", price: 2 },
  { name: "Badge with music NFC", price: 3.5, note: "Tap with a phone to play music" },
  { name: "Badge with video NFC, up to 10 seconds", price: 4, note: "Tap with a phone to play your video" },
  { name: "Badge with video NFC, up to 20 seconds", price: 4.5 },
  { name: "Badge with video NFC, up to 30 seconds", price: 5 },
  { name: "Keychain", price: 1, note: "RM0.60 with any badge" },
];

/** Things to buy at the studio. */
export const SHOP: { group: string; blurb: string; items: Product[] }[] = [
  {
    group: "Photo prints & scrapbooks",
    blurb: "Print more memories, and keep them somewhere special.",
    items: [
      { name: "A5 photo print", price: PRICING.a5Print },
      { name: "A4 photo print", price: PRICING.a4Print },
      { name: "15-page scrapbook", price: 15 },
      { name: "30-page scrapbook", price: 20 },
      { name: "2 extra scrapbook pages", price: 1 },
    ],
  },
];

/** Café drinks: the regular price, and the price when added to a workshop (also used when pre-ordering). */
export type Drink = { name: string; price: number; sessionPrice: number };
export const DRINKS: Drink[] = [
  { name: "Americano", price: 6.5, sessionPrice: 5 },
  { name: "Latte", price: 8.5, sessionPrice: 7 },
  { name: "Cappuccino", price: 8.5, sessionPrice: 7 },
  { name: "Matcha", price: 8.5, sessionPrice: 8.5 }, // session price not decided yet
  { name: "Chocolate", price: 8.5, sessionPrice: 8.5 }, // session price not decided yet
];

export const PASTRIES: Product[] = [
  { name: "Apple fritter", price: 6.5 },
  { name: "Peach danish", price: 7 },
];

/** Every drink at the regular price comes with a coupon printed on seed paper. */
export const SEED_COUPON = "Every drink at the regular price comes with a seed paper coupon: 20% off your next drink during your visit. Plant it afterwards and it grows.";

export const FAQS = [
  {
    q: "Which package should I choose?",
    a: "Basic (30 minutes for RM8, or 1 hour for RM14) is studio time with our shared tools and stationery. Memory Maker (RM21) adds an NFC badge and two A5 photo prints. Complete Memory (RM35) adds an A4 print and a 15-page scrapbook too. Just want a badge? The Badge workshop is RM15 with one NFC tag free.",
  },
  {
    q: "How does extra time work?",
    a: `Packages include 1 hour (or 30 minutes for Basic – 30 minutes). ${EXTRA_TIME_RULE} Most Memory Maker guests take 1.5–2 hours, and Complete Memory 2–2.5 hours.`,
  },
  {
    q: "Do I need to be good at art or crafts?",
    a: "Not at all. You choose a prepared design and make it yourself with our materials, tools and simple instructions. Our team is happy to help.",
  },
  {
    q: "How do my photo prints work?",
    a: `Memory Maker includes two A5 photo prints: one A4 sheet you design on our Photo Collage page. Complete Memory adds an A4 print. Split the sheet, make a grid or draw shapes, then add your photos, before your visit or at the studio. Extra sheets are ${formatRM(PRICING.photoSheet)} each.`,
  },
  {
    q: "What happens to my photos?",
    a: "They're only kept while you make your prints and until we've printed them. As soon as you've settled your bill and leave, they're deleted. Photos you swap out or discard are deleted straight away.",
  },
  {
    q: "Is there food and coffee?",
    a: `Snacks and water are free flow. Add an Americano to your workshop for ${formatRM(DRINKS[0].sessionPrice)} or a latte or cappuccino for ${formatRM(DRINKS[1].sessionPrice)}, and try our pastries. ${SEED_COUPON}`,
  },
  {
    q: "What are NFC badges?",
    a: "Badges with a tiny tag inside. Tap one with a phone to play your music or a video of up to 10, 20 or 30 seconds, no app needed. A great gift.",
  },
  {
    q: "Is it suitable for kids?",
    a: "Yes, families are very welcome. Younger children should be accompanied by an adult.",
  },
];
