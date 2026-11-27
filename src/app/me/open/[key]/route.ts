import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, cookieOptions, getSession, sessionFromLaunchKey, touchSession } from "@/lib/accounts";

/**
 * Where the home screen icon starts. Already logged in: renews the login and opens the customer's page.
 * Otherwise (a home screen app has its own cookies) the key in the address logs this app in.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/me/open/[key]">) {
  const { key } = await ctx.params;
  const to = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url), 303);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
  try {
    const current = await getSession();
    if (current) {
      await touchSession(current);
      const res = to("/me");
      res.cookies.set(SESSION_COOKIE, current.token, cookieOptions());
      return res;
    }
    const token = await sessionFromLaunchKey(key, request.headers.get("user-agent"));
    if (!token) return to("/login?next=/me");
    const res = to("/me");
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  } catch (e) {
    console.error(e);
    return to("/me");
  }
}
