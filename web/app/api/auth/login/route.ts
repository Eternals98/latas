import { backendFetch } from "../../../../lib/backend";
import { encodeSessionUser, SESSION, signSession } from "../../../../lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const USERS: Record<string, { password: string; role: "admin" | "vendedor" }> = {
  admin: { password: "admin", role: "admin" },
  vendedor: { password: "vendedor", role: "vendedor" }
};

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string; email?: string };
  const username = (body.username || body.email || "").trim().toLowerCase();
  const password = (body.password || "").trim();

  if (!username || !password) {
    return NextResponse.json({ detail: "Credenciales requeridas." }, { status: 400 });
  }

  const user = USERS[username];
  if (!user || user.password !== password) {
    return NextResponse.json({ detail: "Usuario o contraseña inválidos." }, { status: 401 });
  }

  if (user.role === "admin") {
    const response = await backendFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ detail: "Unauthorized" }));
      return NextResponse.json({ detail: payload.detail || "Unauthorized" }, { status: 401 });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION.cookieName, signSession(encodeSessionUser({ username, role: user.role })), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return NextResponse.json({ ok: true, role: user.role, username });
}
