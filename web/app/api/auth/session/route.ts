import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSessionUser, SESSION } from "../../../../lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION.cookieName)?.value;
  const session = decodeSessionUser(raw);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, ...session });
}
