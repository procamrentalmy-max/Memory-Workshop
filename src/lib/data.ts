// Central business data. Edit prices, templates and products here.

export const STUDIO = {
  name: "Paper & Moments",
  tagline: "A hands-on memory creation studio",
  email: "hello@paperandmoments.my",
  phone: "+60 12-345 6789",
  address: "Kuala Lumpur, Malaysia",
  hours: "Tue – Sun · 10:00 am – 10:00 pm",
};

export const PRICING = {
  sessionPerPersonPerHour: 16, // RM
  perPage: 9, // RM, each preset page
  customPageBase: 0, // RM, base price of a drag & drop page (elements are charged individually)
  currency: "RM",
};

/** Every order is planned as a 1.5 hour visit (used for estimates and, later, seating). */
export const SESSION_HOURS = 1.5;

/** Seating capacity. Set once the studio layout is known; null = no limit enforced yet. */
export const SEATING: { seats: number | null } = { seats: null };

/** Arrival times every 30 min, last arrival leaves time for a 1.5 hr visit before 10 pm. */
export const ARRIVAL_TIMES = Array.from({ length: 22 }, (_, i) => {
  const mins = 10 * 60 + i * 30; // 10:00 … 20:30
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

export type Category =
  | "Travel"
  | "Couples"
  | "Friends"
  | "Family"
  | "Celebrations"
  | "Everyday";

export type Difficulty = "Easy" | "Medium" | "Detailed";

export type Template = {
  id: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  minutes: number; // approx. time to complete
  photos: number; // photo slots on the page
  features: string[]; // e.g. pop-up, pocket, flap
  palette: [string, string, string]; // used for the CSS preview
  layout: "grid" | "polaroid" | "collage" | "pocket" | "popup" | "strip";
};

const T = (
  id: string,
  name: string,
  category: Category,
  difficulty: Difficulty,
  minutes: number,
  photos: number,
  features: string[],
  palette: [string, string, string],
  layout: Template["layout"],
): Template => ({ id, name, category, difficulty, minutes, photos, features, palette, layout });

export const TEMPLATES: Template[] = [
  // Travel
  T("passport-stamps", "Passport Stamps", "Travel", "Medium", 40, 4, ["Ticket pocket", "Stamp stickers"], ["#e9d8b4", "#2f4858", "#c8553d"], "pocket"),
  T("boarding-pass", "Boarding Pass", "Travel", "Easy", 25, 2, ["Tear-off stub"], ["#dfe7ec", "#33658a", "#f6ae2d"], "strip"),
  T("postcard-wall", "Postcards From…", "Travel", "Easy", 30, 4, ["Fold-out postcards"], ["#f3e3cf", "#86a873", "#bb4430"], "grid"),
  T("road-trip-map", "Road Trip Map", "Travel", "Detailed", 60, 5, ["Fold-out map", "Route stickers"], ["#efe6d2", "#5b8e7d", "#bc4b51"], "collage"),
  T("beach-days", "Beach Days", "Travel", "Easy", 25, 3, ["Sand-texture border"], ["#fdf0d5", "#4ea8de", "#f4a259"], "polaroid"),
  T("city-skyline", "City Skyline Pop-Up", "Travel", "Detailed", 55, 3, ["Pop-up skyline"], ["#e8e4f0", "#2b2d42", "#ef8354"], "popup"),
  T("ticket-collector", "Ticket Collector", "Travel", "Easy", 20, 2, ["Ticket pocket"], ["#f7ede2", "#84a59d", "#f28482"], "pocket"),
  // Couples
  T("our-first-date", "Our First Date", "Couples", "Easy", 30, 3, ["Love-note flap"], ["#fbe4e4", "#9d4edd", "#e5383b"], "polaroid"),
  T("love-letters", "Love Letters", "Couples", "Medium", 40, 2, ["Envelope pocket", "Hidden letter"], ["#f9e0d9", "#7a3e48", "#e6a57e"], "pocket"),
  T("anniversary-timeline", "Anniversary Timeline", "Couples", "Detailed", 60, 6, ["Fold-out timeline"], ["#f4eee6", "#5e3023", "#c08552"], "strip"),
  T("heart-popup", "Heart Pop-Up", "Couples", "Detailed", 50, 2, ["Pop-up heart"], ["#ffe5ec", "#c9184a", "#ff8fa3"], "popup"),
  T("reasons-why", "52 Reasons Why", "Couples", "Medium", 45, 1, ["Pull-tab cards"], ["#fff1e6", "#6d597a", "#e56b6f"], "grid"),
  T("date-night", "Date Night", "Couples", "Easy", 25, 3, ["Movie-ticket stub"], ["#ede0d4", "#22223b", "#c9ada7"], "strip"),
  // Friends
  T("photobooth-strip", "Photobooth Strip", "Friends", "Easy", 20, 4, ["Strip frame"], ["#fefae0", "#283618", "#dda15e"], "strip"),
  T("squad-goals", "Squad Goals", "Friends", "Medium", 35, 6, ["Name tags"], ["#e0fbfc", "#3d5a80", "#ee6c4d"], "collage"),
  T("concert-night", "Concert Night", "Friends", "Medium", 35, 3, ["Wristband pocket"], ["#1f1d36", "#e9a6a6", "#864879"], "pocket"),
  T("inside-jokes", "Inside Jokes", "Friends", "Easy", 25, 3, ["Speech-bubble stickers"], ["#fff3b0", "#335c67", "#e09f3e"], "polaroid"),
  T("bff-slam-book", "BFF Slam Book", "Friends", "Medium", 40, 2, ["Q&A flaps"], ["#f1faee", "#457b9d", "#e63946"], "grid"),
  T("graduation-day", "Graduation Day", "Friends", "Medium", 40, 4, ["Cap pop-out"], ["#edf2f4", "#2b2d42", "#d4a017"], "popup"),
  // Family
  T("family-tree", "Family Tree", "Family", "Detailed", 60, 8, ["Leaf name tags"], ["#eef4e6", "#4f772d", "#a68a64"], "collage"),
  T("baby-firsts", "Baby's Firsts", "Family", "Medium", 40, 4, ["Milestone tabs"], ["#e3f2fd", "#5390d9", "#ffb4a2"], "grid"),
  T("grandparents-stories", "Grandparents' Stories", "Family", "Medium", 45, 3, ["Story pocket"], ["#f5ebe0", "#6f4e37", "#d5bdaf"], "pocket"),
  T("sunday-lunch", "Sunday Lunch", "Family", "Easy", 25, 3, ["Recipe card"], ["#fff8e7", "#bc6c25", "#606c38"], "polaroid"),
  T("growing-up", "Growing Up Height Chart", "Family", "Detailed", 55, 5, ["Fold-out ruler"], ["#f0efeb", "#3a86ff", "#ffbe0b"], "strip"),
  T("pet-pals", "Pet Pals", "Family", "Easy", 20, 3, ["Paw-print stickers"], ["#fdf6ec", "#8d6346", "#e9c46a"], "polaroid"),
  // Celebrations
  T("birthday-bash", "Birthday Bash", "Celebrations", "Easy", 25, 3, ["Cake pop-up"], ["#fff0f3", "#ff4d6d", "#ffd166"], "popup"),
  T("hari-raya", "Hari Raya Memories", "Celebrations", "Medium", 40, 4, ["Ketupat fold"], ["#eaf4e4", "#2d6a4f", "#d4a373"], "collage"),
  T("chinese-new-year", "Chinese New Year", "Celebrations", "Medium", 40, 4, ["Ang pow pocket"], ["#fde8e8", "#b5161d", "#e9b949"], "pocket"),
  T("deepavali-lights", "Deepavali Lights", "Celebrations", "Medium", 40, 3, ["Kolam pattern"], ["#fff4e0", "#7b2cbf", "#f77f00"], "grid"),
  T("christmas-cheer", "Christmas Cheer", "Celebrations", "Easy", 30, 3, ["Ornament tags"], ["#f1f7ed", "#1b4332", "#c1121f"], "polaroid"),
  T("wedding-day", "Wedding Day", "Celebrations", "Detailed", 60, 5, ["Lace border", "Vow pocket"], ["#fbf8f3", "#a68a64", "#d6ccc2"], "collage"),
  // Everyday
  T("coffee-diary", "Coffee Diary", "Everyday", "Easy", 20, 2, ["Coffee-ring stickers"], ["#efe3d3", "#5e3c2b", "#b08968"], "grid"),
  T("year-in-review", "Year in Review", "Everyday", "Detailed", 60, 12, ["Month grid"], ["#f8f9fa", "#343a40", "#e76f51"], "grid"),
  T("little-wins", "Little Wins", "Everyday", "Easy", 20, 2, ["Gold-star stickers"], ["#fffbea", "#386641", "#f2cc8f"], "polaroid"),
  T("bucket-list", "Bucket List", "Everyday", "Medium", 35, 3, ["Tick-box flaps"], ["#edf6f9", "#006d77", "#e29578"], "strip"),
  T("rainy-day", "Rainy Day Mood", "Everyday", "Easy", 25, 2, ["Raindrop layers"], ["#e7ecef", "#274c77", "#8b8c89"], "collage"),
];

export const CATEGORIES: Category[] = [
  "Travel",
  "Couples",
  "Friends",
  "Family",
  "Celebrations",
  "Everyday",
];

export type Product = {
  name: string;
  price: number;
  note?: string;
};

/** Free with every session: customers use as much as they like while they create. */
export const FREE_SUPPLIES: { group: string; items: string[] }[] = [
  {
    group: "Stickers",
    items: ["Themed sticker sheets", "Holographic stars", "Alphabet letters", "Washi tape"],
  },
  {
    group: "Stationery",
    items: ["Gel pens in every colour", "Date stamps", "Corner punches", "Glue tape & scissors"],
  },
];

/** Things to buy at the studio (stickers and stationery are free, see FREE_SUPPLIES). */
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

/** Drinks customers can pre-order when booking. The full café menu is a PDF uploaded in /admin. */
export const DRINKS: Product[] = [
  { name: "Americano", price: 9 },
  { name: "Latte", price: 12 },
  { name: "Iced chocolate", price: 11 },
  { name: "Sparkling lemonade", price: 8 },
];

export const FAQS = [
  {
    q: "Do I need to be good at art or crafts?",
    a: "Not at all. Every page comes with printed materials, cutting lines, folding guides and step-by-step instructions, so anyone can make something beautiful.",
  },
  {
    q: "How is the price worked out?",
    a: `The studio session is ${formatRM(PRICING.sessionPerPersonPerHour)} per person per hour (most visits take about ${SESSION_HOURS} hours). Ready-made pages are ${formatRM(PRICING.perPage)} each. If you design your own page, you only pay for the elements you add; sections and text boxes are free.`,
  },
  {
    q: "Can I use my own photos?",
    a: "Yes. When you choose your pages, tap any photo frame to add a photo from your gallery, then move and zoom it to fit. We'll print them ready for your visit. Bring tickets, souvenirs and other keepsakes too.",
  },
  {
    q: "Do stickers and stationery cost extra?",
    a: "No. Stickers, washi tape, pens, stamps and all our stationery are free to use during your session, as much as you like.",
  },
  {
    q: "How long should I plan to stay?",
    a: `Plan for about ${SESSION_HOURS} hours. Just choose when you'd like to arrive; there's no need to pick an end time.`,
  },
  {
    q: "Is it suitable for kids?",
    a: "Yes, families are very welcome. We recommend the 'Easy' templates for younger children, who should be accompanied by an adult.",
  },
];

