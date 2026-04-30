import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION } from "../../../../lib/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION.cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return NextResponse.json({ ok: true });
}
