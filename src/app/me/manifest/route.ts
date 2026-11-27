import { getSession, launchKeyFor } from "@/lib/accounts";
import { STUDIO } from "@/lib/data";

/**
 * The home screen app's manifest. It's fetched with the login cookie, so its start address carries this
 * login's home screen key: the icon then opens the customer's page already logged in, even on iPhones,
 * where a home screen app doesn't share Safari's cookies.
 */
export async function GET() {
  const session = await getSession().catch(() => null);
  const manifest = {
    id: "/me",
    name: STUDIO.name,
    short_name: STUDIO.name,
    description: "Your Memory Badges, prints and bookings.",
    start_url: session ? `/me/open/${launchKeyFor(session.token)}` : "/me",
    scope: "/",
    display: "standalone",
    background_color: "#faf6ef",
    theme_color: "#faf6ef",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
