import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { detail: "Token requerido" },
        { status: 400 }
      );
    }

    // Validar en backend
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { detail: "Token inválido" },
        { status: res.status }
      );
    }

    const profile = await res.json();

    const response = NextResponse.json({
      id: profile.id,
      role: profile.role,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    response.cookies.set("user_role", profile.role, {
      httpOnly: false, // Necesita ser accesible
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { detail: "Error de conexión" },
      { status: 500 }
    );
  }
}