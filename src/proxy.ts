import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorized, isStaffAuthorized } from "@/lib/adminAuth";

export function proxy(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const worker = request.nextUrl.pathname.startsWith("/worker");
  if (worker ? isStaffAuthorized(auth) : isAdminAuthorized(auth)) return NextResponse.next();
  return new NextResponse(worker ? "Staff login required" : "Admin login required", {
    status: 401,
    headers: { "WWW-Authenticate": worker ? 'Basic realm="Studio staff"' : 'Basic realm="Studio admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/worker/:path*"],
};
