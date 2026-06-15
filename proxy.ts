import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.get("isLoggedIn")?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/login", "/display", "/daftar-online"];
  if (!isLoggedIn && !publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|logo-afina\\.png).*)"],
};
