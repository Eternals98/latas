import { NextResponse } from "next/server";
import { createSupabaseClient } from "../../../../lib/supabase";
import { AUTH_COOKIE } from "../../../../lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; username?: string };
  const email = (body.email || body.username || "").trim();
  const password = (body.password || "").trim();

  if (!email || !password) {
    return NextResponse.json({ detail: "Credenciales requeridas." }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    return NextResponse.json({ detail: "Credenciales inválidas. Intente Nuevamente." }, { status: 401 });
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in || 3600,
  });

  return NextResponse.json({ ok: true });
}
