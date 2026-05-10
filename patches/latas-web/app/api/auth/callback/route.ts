import { NextRequest, NextResponse } from 'next/server';

const COOKIE = {
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge:   60 * 60 * 24, // 24 h
  path:     '/',
};

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ detail: 'Token requerido' }, { status: 400 });
    }

    // ✅ /auth/callback (POST) — sincroniza/crea el perfil en BD
    //    NO usar /auth/me (GET) — ese solo lee el perfil existente, no lo crea
    const backendUrl = `${process.env.BACKEND_API_URL ?? 'http://localhost:8000'}/api/v1/auth/callback`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { detail: err?.detail ?? 'Token inválido' },
        { status: res.status },
      );
    }

    const profile = await res.json(); // { id, email, full_name, role }

    const response = NextResponse.json({
      id:       profile.id,
      email:    profile.email,
      fullName: profile.full_name,
      role:     profile.role,
    });

    // HTTP-only — inaccesible desde JS (protección XSS)
    response.cookies.set('auth_token', token, { ...COOKIE, httpOnly: true });

    // NO http-only — middleware y cliente pueden leerlo
    response.cookies.set('user_role', profile.role, { ...COOKIE, httpOnly: false });

    return response;
  } catch (error) {
    console.error('[auth/callback]', error);
    return NextResponse.json({ detail: 'Error de conexión con el backend' }, { status: 500 });
  }
}
