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
  session: 24, // RM per person: a 1-hour session with everything in SESSION_INCLUDES
  extraHalfHour: 5, // RM for each further 30 minutes, added at the studio
  photoPrint: 1.5, // RM per photo on extra photo sheets (each person's first A4 sheet is included)
  currency: "RM",
};

/** A session is 1 hour (used for estimates and, later, seating). */
export const SESSION_HOURS = 1;

/** What the RM24 session includes, per person. */
export const SESSION_INCLUDES = [
  "1 Memory Badge",
  "1 textured scrapbook",
  "Unlimited papers, cutters, accessories, stickers and ribbons",
  "2 A5 photo prints you design on our website",
  "Free-flow snacks and water",
];

/** Photo sheets included per person: one A4 sheet (two A5 prints, or any layout). */
export const INCLUDED_SHEETS_PER_PERSON = 1;

/** Seating capacity. Set once the studio layout is known; null = no limit enforced yet. */
export const SEATING: { seats: number | null } = { seats: null };

/** Arrival times every 30 min; the last arrival leaves time for a 1-hour session before 10 pm. */
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
    group: "Notebooks & Scrapbooks",
    blurb: "Take your pages home in something worth keeping.",
    items: [
      { name: "A5 dotted notebook", price: 22 },
      { name: "Kraft scrapbook album (20 sleeves)", price: 45 },
      { name: "Linen-cover keepsake album", price: 79 },
      { name: "Refill page sleeves (10)", price: 15 },
    ],
  },
];

/** Café drinks: the regular price, and the price when added to a session (also used when pre-ordering). */
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
    q: "What does the RM24 session include?",
    a: `One hour in the studio with ${SESSION_INCLUDES.slice(0, -1).join(", ").toLowerCase()}, and ${SESSION_INCLUDES[SESSION_INCLUDES.length - 1].toLowerCase()}. Want longer? Each extra 30 minutes is ${formatRM(PRICING.extraHalfHour)}.`,
  },
  {
    q: "Do I need to be good at art or crafts?",
    a: "Not at all. There's no wrong way to fill a scrapbook, and our team is happy to help with ideas.",
  },
  {
    q: "How do my photo prints work?",
    a: "Your session includes two A5 photo prints: one A4 sheet you design on our Photo Collage page. Split it in two, make a grid or draw shapes, then add your photos. Do it before your visit or at the studio. Extra sheets are RM1.50 per photo.",
  },
  {
    q: "What happens to my photos?",
    a: "They're only kept while you make your prints and until we've printed them. As soon as you've settled your bill and leave, they're deleted. Photos you swap out or discard are deleted straight away.",
  },
  {
    q: "Is there food and coffee?",
    a: `Snacks and water are free flow. Add an Americano to your session for ${formatRM(DRINKS[0].sessionPrice)} or a latte or cappuccino for ${formatRM(DRINKS[1].sessionPrice)}, and try our pastries. ${SEED_COUPON}`,
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
