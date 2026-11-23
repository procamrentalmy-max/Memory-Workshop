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
- `bookings` table: every booking, including the full order and any custom page designs.
- `elements` storage bucket: element images (publicly readable; uploads only through the server).

- `customer-photos` storage bucket (private): photos customers put in photo frames.
- `site-files` storage bucket (public): the café menu PDF.
- `customer_photos` and `site_settings` tables: photo activity, and settings such as the current café menu.

All tables have row-level security on with no public policies, so only the website's server
(using the secret key) can read or write them.

### Customer photo retention

The rules are in the database function `customer_photo_status()`:

- Photos in a booking are kept until the session ends (arrival + 1.5 hours), then deleted.
- Photos not yet booked are kept while the customer keeps using them, and deleted after 7 days without use
  (the booking pages tell the server whenever a customer opens them).

The edge function `supabase/functions/cleanup-photos` deletes expired photos. It runs every hour from
`pg_cron` (job `cleanup-customer-photos`). The admin page shows the counts and can run the clean-up straight away.
