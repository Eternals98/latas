import { getAccessTokenFromCookies } from "./auth";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "").replace(/\/$/, "");

function requireBackendUrl(): string {
  if (!BACKEND_API_URL) {
    throw new Error("BACKEND_API_URL is required");
  }
  return BACKEND_API_URL;
}

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessTokenFromCookies();
  const headers = new Headers(init?.headers || {});
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${requireBackendUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
