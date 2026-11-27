import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, cookieOptions, createSession, redeemLoginLink } from "@/lib/accounts";

/** A one-time sign-in QR code from our staff (for a customer who forgot their password). */
export async function GET(request: NextRequest, ctx: RouteContext<"/me/signin/[token]">) {
  const { token } = await ctx.params;
  const to = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url), 303);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
  try {
    const customerId = await redeemLoginLink(token);
    if (!customerId) return to("/login?link=expired");
    const session = await createSession(customerId, { canResetPassword: true, userAgent: request.headers.get("user-agent") });
    const res = to("/me");
    res.cookies.set(SESSION_COOKIE, session, cookieOptions());
    return res;
  } catch (e) {
    console.error(e);
    return to("/login?link=expired");
  }
}
