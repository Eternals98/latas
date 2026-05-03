import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_EXPIRES_AT_COOKIE } from "../../../../lib/auth";
import { CSRF_COOKIE, requireCsrf } from "../../../../lib/csrf";

export async function POST(request: NextRequest) {
  if (!requireCsrf(request)) {
    return NextResponse.json({ detail: "CSRF inválido." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(AUTH_EXPIRES_AT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(CSRF_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
