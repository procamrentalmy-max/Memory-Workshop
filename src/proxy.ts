import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";

export function proxy(request: NextRequest) {
  if (isAdminAuthorized(request.headers.get("authorization"))) return NextResponse.next();
  return new NextResponse("Admin login required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Studio admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
