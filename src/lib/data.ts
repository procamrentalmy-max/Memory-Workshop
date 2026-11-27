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
  a4Colour: 1.5, // RM, an A4 colour print on plain paper
  a4Mono: 0.5, // RM, an A4 black & white print on plain paper
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
  addOn?: boolean; // taken with a studio-time package (doesn't count as a person)
};

/** Workshop packages, one per person. */
export const PACKAGES: Package[] = [
  { id: "basic30", name: "Basic – 30 minutes", price: 8, sheets: 0, includes: ["30 minutes in the studio", "Shared tools, stationery and stickers"] },
  { id: "basic60", name: "Basic – 1 hour", price: 14, sheets: 0, includes: ["1 hour in the studio", "Shared tools, stationery and stickers"] },
  {
    id: "memory-maker", name: "Memory Maker", price: 21, sheets: 1, typical: "Most guests take 1.5–2 hours",
    includes: ["1 hour in the studio", "1 Memory Badge (a badge with NFC)", "2 A5 photo prints"],
  },
  {
    id: "complete", name: "Complete Memory", price: 35, sheets: 2, typical: "Most guests take 2–2.5 hours",
    includes: ["1 hour in the studio", "1 Memory Badge (a badge with NFC)", "2 A5 photo prints and 1 A4 print", "15-page scrapbook"],
  },
  {
    id: "badge", name: "Memory Badge workshop", price: 15, sheets: 0, addOn: true,
    includes: ["Make your own Memory Badge (a badge with NFC)", "It plays a video of up to 30 seconds", "Sets up your NFC account"],
    note: "Studio time is extra: add Basic – 30 minutes (RM8) or Basic – 1 hour (RM14). More Memory Badges: RM2 for the badge plus the NFC price.",
  },
];
export const PACKAGE_IDS = PACKAGES.map((p) => p.id);
export const packageById = (id: string) => PACKAGES.find((p) => p.id === id);

/** Packages include 1 hour (used for calendar invites and, later, seating). */
export const SESSION_HOURS = 1;

/** Extra time, in plain words. */
export const EXTRA_TIME_RULE = `Staying past your hour? Each extra 30 minutes is RM${PRICING.extraHalfHour}, after a ${PRICING.graceMinutes}-minute grace period.`;

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
  maxPrice?: number; // for a price range, e.g. RM3.50–6.50
  note?: string;
};

/** "RM7.00", "RM3.50–6.50" for a range, or "Free". */
export const priceLabel = (p: Pick<Product, "price" | "maxPrice">) =>
  p.maxPrice ? `${formatRM(p.price)}–${formatRM(p.maxPrice).replace(/^RM/, "")}` : p.price === 0 ? "Free" : formatRM(p.price);

/** Bracelet making: one free for each person in every workshop, then a price per extra bracelet. */
export const BRACELETS: Product[] = [
  { name: "Your first bracelet", price: 0, note: "One free for each person, in every workshop" },
  { name: "Each extra bracelet", price: 1.7 },
];

/** Free to use, as much as you like, during every session. */
export const FREE_SUPPLIES: { group: string; items: string[] }[] = [
  { group: "Cutters & tapes", items: ["Shaped cutters and corner punches", "Washi and decorative tapes", "Stamps and gel pens", "Themed sticker sheets"] },
  { group: "Ribbons & accessories", items: ["Ribbons in every colour", "Embellishments and accessories", "Decorative papers", "Glue, scissors and the basics"] },
  { group: "Bracelets", items: ["Make your own bracelet: one free for each person", "More bracelets RM1.70 each"] },
];

/** Free in every workshop (shown as perks). */
export const FREE_PERKS = "Every workshop comes with a free bracelet for each person, a huge selection of free cutters, ribbons, tapes and accessories, free water, and a free pastry tasting every 30 minutes.";

/** Badges and keychains. */
export const BADGES: Product[] = [
  { name: "Badge", price: 2 },
  { name: "Keychain", price: 1, note: "RM0.60 with any badge" },
];

/**
 * NFC: tap with a phone to play music or a video. A Memory Badge is a badge with NFC. The first comes with the Memory
 * Badge workshop, which also sets up the customer's account; after that, each one is the badge (BADGES) plus
 * the NFC below, priced by what it plays.
 */
export const NFC_PRICES: Product[] = [
  { name: "Music", price: 1.5 },
  { name: "Video up to 10 seconds", price: 2 },
  { name: "Video up to 30 seconds", price: 2.5 },
  { name: "Video up to 1 minute", price: 5 },
];
export const NFC_RULE = "A Memory Badge is a badge with NFC. Your first comes with the Memory Badge workshop (RM15), which also sets up your NFC account. After that, each Memory Badge is the badge (RM2) plus the NFC price.";

/** Things to buy at the studio. */
export const SHOP: { group: string; blurb: string; items: Product[] }[] = [
  {
    group: "Prints & scrapbooks",
    blurb: "Print more memories, and keep them somewhere special.",
    items: [
      { name: "A5 photo print", price: PRICING.a5Print },
      { name: "A4 photo print", price: PRICING.a4Print },
      { name: "A4 colour print (plain paper)", price: PRICING.a4Colour },
      { name: "A4 black & white print (plain paper)", price: PRICING.a4Mono },
      { name: "15-page scrapbook", price: 15 },
      { name: "30-page scrapbook", price: 20 },
      { name: "2 extra scrapbook pages", price: 1 },
    ],
  },
];

/** Café drinks: the regular price, and the price when added to a workshop (also used when pre-ordering). */
/** `price` null = only sold as a workshop add-on. */
export type Drink = { name: string; price: number | null; sessionPrice: number };
export const DRINKS: Drink[] = [
  { name: "Americano", price: 6.5, sessionPrice: 4.9 },
  { name: "Pot of tea (free refills)", price: null, sessionPrice: 4.9 },
  { name: "Latte", price: 8.5, sessionPrice: 7 },
  { name: "Cappuccino", price: 8.5, sessionPrice: 7 },
  { name: "Matcha", price: 8.5, sessionPrice: 8.5 }, // session price not decided yet
  { name: "Chocolate", price: 8.5, sessionPrice: 8.5 }, // session price not decided yet
];

const drinkByName = (name: string) => DRINKS.find((d) => d.name === name)!;

export const PASTRIES: Product[] = [
  { name: "Apple fritter", price: 6.5 },
  { name: "Danish pastry", price: 7 },
  { name: "Croissant", price: 3.5, maxPrice: 6.5 },
];

/** Every drink at the regular price comes with a coupon printed on seed paper. */
export const SEED_COUPON = "Every drink at the regular price comes with a seed paper coupon: 20% off your next drink during your visit. Plant it afterwards and it grows.";

export const FAQS = [
  {
    q: "Which package should I choose?",
    a: "Basic (30 minutes for RM8, or 1 hour for RM14) is studio time with our shared tools and stationery. Memory Maker (RM21) adds a Memory Badge (a badge with NFC) and two A5 photo prints. Complete Memory (RM35) adds an A4 print and a 15-page scrapbook too. Want to make a Memory Badge? Add the Memory Badge workshop (RM15, with a video of up to 30 seconds) to a Basic package for your studio time.",
  },
  {
    q: "How does extra time work?",
    a: `Packages include 1 hour (or 30 minutes for Basic – 30 minutes). After your hour, each extra 30 minutes is RM${PRICING.extraHalfHour}, with a ${PRICING.graceMinutes}-minute grace period. Most Memory Maker guests take 1.5–2 hours, and Complete Memory 2–2.5 hours.`,
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
    a: `Water is free, and we bring round a free pastry tasting every 30 minutes. Our café serves coffee, matcha, chocolate and pastries. Add an Americano or a pot of tea with free refills to your workshop for ${formatRM(drinkByName("Americano").sessionPrice)}, or a latte or cappuccino for ${formatRM(drinkByName("Latte").sessionPrice)}. ${SEED_COUPON}`,
  },
  {
    q: "What is a Memory Badge?",
    a: "A badge with NFC: a tiny tag inside plays your music or a video of up to 1 minute when you tap it with a phone, no app needed. Start with the Memory Badge workshop (RM15): it includes your first Memory Badge and sets up your account. After that, each Memory Badge is RM2 for the badge plus the NFC: RM1.50 for music, RM2 for a video up to 10 seconds, RM2.50 up to 30 seconds or RM5 up to 1 minute.",
  },
  {
    q: "Is it suitable for kids?",
    a: "Yes, families are very welcome. Younger children should be accompanied by an adult.",
  },
];
