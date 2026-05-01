import { NextResponse } from "next/server";
import { getAccessTokenFromCookies } from "../../../../lib/auth";

function backendUrl(): string {
  const base = (process.env.BACKEND_API_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_API_URL is required");
  return base;
}

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const response = await fetch(`${backendUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      {
        authenticated: false,
        backend_status: response.status,
        backend_detail: detail || null,
      },
      { status: 401 },
    );
  }

  const payload = (await response.json()) as {
    id: string;
    full_name: string;
    role: "admin" | "cashier";
  };

  return NextResponse.json({
    authenticated: true,
    userId: payload.id,
    username: payload.full_name,
    role: payload.role,
  });
}
