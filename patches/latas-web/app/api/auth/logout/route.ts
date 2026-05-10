import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // ✅ Borrar ambas cookies (antes solo se borraba auth_token)
  response.cookies.delete('auth_token');
  response.cookies.delete('user_role');
  return response;
}
