import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, cookieOptions } from "@/lib/accountCookie";
import { isAdminAuthorized, isStaffAuthorized } from "@/lib/adminAuth";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Customers stay logged in: each visit to their page renews the login cookie for another 400 days.
  if (path === "/me") {
    const res = NextResponse.next();
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  }

  const auth = request.headers.get("authorization");
  const worker = path.startsWith("/worker");
  if (worker ? isStaffAuthorized(auth) : isAdminAuthorized(auth)) return NextResponse.next();
  return new NextResponse(worker ? "Staff login required" : "Admin login required", {
    status: 401,
    headers: { "WWW-Authenticate": worker ? 'Basic realm="Studio staff"' : 'Basic realm="Studio admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/worker/:path*", "/me"],
};
