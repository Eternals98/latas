import { backendFetch } from "../../../../lib/backend";
import { SESSION, signSession } from "../../../../lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = (body.username || process.env.ADMIN_UI_USERNAME || "admin").trim();
  if (!username || !body.password) {
    return NextResponse.json({ detail: "Credenciales requeridas." }, { status: 400 });
  }

  const response = await backendFetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password: body.password
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Unauthorized" }));
    return NextResponse.json({ detail: payload.detail || "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION.cookieName, signSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return NextResponse.json({ ok: true });
}
