import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/adminAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    const token = request.cookies.get("admin_session")?.value;
    if (await verifySessionToken(token)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_session")?.value;
    if (!(await verifySessionToken(token))) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
