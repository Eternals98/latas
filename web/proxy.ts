import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_EXPIRES_AT_COOKIE } from "./lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/session"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const expiresAtRaw = request.cookies.get(AUTH_EXPIRES_AT_COOKIE)?.value;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  const isExpired = !Number.isFinite(expiresAt) || expiresAt <= now;

  if (!token || isExpired) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
