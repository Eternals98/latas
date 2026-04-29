import { SESSION, signSession } from "../../../../lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const expectedPassword = process.env.ADMIN_UI_PASSWORD;
  if (!expectedPassword || body.password !== expectedPassword) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION.cookieName, signSession("ok"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return NextResponse.json({ ok: true });
}
