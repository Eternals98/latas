import { cookies } from "next/headers";

export const AUTH_COOKIE = "sb_access_token";

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value || null;
}
