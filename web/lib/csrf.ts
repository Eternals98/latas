import crypto from "crypto";
import { NextRequest } from "next/server";

export const CSRF_COOKIE = "latas_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function requireCsrf(request: NextRequest): boolean {
  const token = request.headers.get(CSRF_HEADER);
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;
  return Boolean(token && cookie && token === cookie);
}
