# Memory Creation Studio website

Website for a hands-on memory creation studio: customers book a visit, choose ready-made
scrapbook pages or design their own with drag and drop, pick a drink, and confirm their booking.

Built with Next.js 16 (App Router), Tailwind CSS 4 and Supabase (database + image storage).

## Pages

| Path | What it is |
| --- | --- |
| `/` | Home page |
| `/templates` | All ready-made pages, with filters |
| `/pricing`, `/shop` | Prices; shop & café menu |
| `/book` → `/book/pages` → `/book/drinks` → `/book/checkout` | The 4 booking steps |
| `/admin` | Upload page elements (with printed size and price) and see bookings. Password protected. |

## Run it locally

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and fill it in:
   - `ADMIN_PASSWORD`: password for `/admin` (any username).
   - `SUPABASE_SECRET_KEY`: Supabase dashboard → Project Settings → API Keys → Secret keys. Server-only; never share it.
   - `NEXT_PUBLIC_SITE_URL`: your public website address once you have one (used for link previews).
3. Install and start:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000.

## Where to change things

- **Prices, opening times, studio details, templates, shop items:** `src/lib/data.ts`
- **Printed page size (A4):** `src/lib/pageSize.ts`
- **Colours and fonts:** `src/app/globals.css`, `src/app/layout.tsx`

## Supabase

- `elements` table: uploaded elements (name, price, printed size in cm, image file).
- `bookings` table: every booking, including the full order and any custom page designs, plus
  `printed_at` and `settled_at` set from the worker page.
- `elements` storage bucket: element images (publicly readable; uploads only through the server).

- `customer-photos` storage bucket (private, JPEG only, up to 30 MB each): photos customers put in photo
  frames. Browsers upload the original photo straight to storage with a one-time link
  (`/api/photos/upload-url`, then `/api/photos/confirm` checks it), so photos print at full resolution and
  never pass through Vercel's 4.5 MB request limit.
- `site-files` storage bucket (public): the café menu PDF.
- `customer_photos` and `site_settings` tables: photo activity, and settings such as the current café menu.

All tables have row-level security on with no public policies, so only the website's server
(using the secret key) can read or write them.

### Worker page

`/worker` lists open orders (today, earlier unsettled, coming up) and refreshes every 30 seconds. For each photo
collage / photo shapes page it makes a print file: an exact-size A4 PDF with the customer's original JPEGs embedded
unchanged and cut to their sections or shapes. Print it at **actual size** (100 %, no "fit to page"), borderless when
the design reaches the edges. It opens with `WORKER_PASSWORD` (set it in Vercel for staff) or `ADMIN_PASSWORD`.

### In-store customers

Walk-in customers don't book. They scan the **in-store QR code** (admin page → In-store QR code; print it for the
tables), which opens `/collage?studio=CODE` and puts their phone in "at the studio" mode for 12 hours. They make
their photo pages and press **Send to print** (`/print`) with their name and table number. The order goes straight to
the worker page as an *In store* order; they pay at the counter (POS) as usual, and **Bill settled** deletes their photos.
Changing the code on the admin page stops old QR codes from working.

### Customer photo retention

The rules are in the database function `customer_photo_status()`:

- Photos in an order are kept for printing until staff press **Bill settled** on the worker page; that deletes
  them straight away. If nobody settles the bill, they are deleted at the end of the day after the visit.
- Photos a customer replaces, cancels, or discards (Start over, removing a photo page from the order) are
  deleted by their browser at once (`/api/photos/release`; photos in a booking are never released).
- Photos on unfinished pages left in a browser are kept while the customer keeps using them, and deleted after
  7 days without use (the booking pages tell the server whenever a customer opens them).

The edge function `supabase/functions/cleanup-photos` deletes expired photos. It runs every hour from
`pg_cron` (job `cleanup-customer-photos`). The admin page shows the counts and can run the clean-up straight away.
