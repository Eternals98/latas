const BACKEND_API_URL = (process.env.BACKEND_API_URL || "").replace(/\/$/, "");

function requireBackendUrl(): string {
  if (!BACKEND_API_URL) {
    throw new Error("BACKEND_API_URL is required");
  }
  return BACKEND_API_URL;
}

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${requireBackendUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
}
