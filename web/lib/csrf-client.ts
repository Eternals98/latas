import { CSRF_COOKIE, CSRF_HEADER } from "./csrf";

export function getCsrfHeaders(): HeadersInit {
  if (typeof document === "undefined") {
    return {};
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE}=`));
  const token = cookie ? decodeURIComponent(cookie.slice(CSRF_COOKIE.length + 1)) : "";

  return token ? { [CSRF_HEADER]: token } : {};
}
