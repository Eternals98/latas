import { cookies } from "next/headers";

export const AUTH_COOKIE = "sb_access_token";
export const AUTH_EXPIRES_AT_COOKIE = "sb_access_token_expires_at";

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value || null;
}
