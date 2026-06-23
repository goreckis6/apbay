import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/adminAuth";
import { ADMIN_BASE, ADMIN_LOGIN } from "@/lib/adminPath";

function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith(ADMIN_BASE);
  const isApi = pathname.startsWith("/api/");

  if (pathname === ADMIN_LOGIN) {
    const token = request.cookies.get("admin_session")?.value;
    if (await verifySessionToken(token)) {
      return withNoIndex(NextResponse.redirect(new URL(ADMIN_BASE, request.url)));
    }
    return withNoIndex(NextResponse.next());
  }

  if (isAdmin) {
    const token = request.cookies.get("admin_session")?.value;
    if (!(await verifySessionToken(token))) {
      const login = new URL(ADMIN_LOGIN, request.url);
      login.searchParams.set("next", pathname);
      return withNoIndex(NextResponse.redirect(login));
    }
    return withNoIndex(NextResponse.next());
  }

  if (isApi) {
    return withNoIndex(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/twojastara/:path*", "/api/:path*"],
};
