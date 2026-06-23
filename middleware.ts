import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/adminAuth";
import { ADMIN_BASE, ADMIN_LOGIN } from "@/lib/adminPath";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_LOGIN) {
    const token = request.cookies.get("admin_session")?.value;
    if (await verifySessionToken(token)) {
      return NextResponse.redirect(new URL(ADMIN_BASE, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith(ADMIN_BASE)) {
    const token = request.cookies.get("admin_session")?.value;
    if (!(await verifySessionToken(token))) {
      const login = new URL(ADMIN_LOGIN, request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/twojastara/:path*"],
};
