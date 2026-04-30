import crypto from "crypto";

const SESSION_COOKIE = "latas_session";
type UserRole = "admin" | "vendedor";

export interface SessionUser {
  username: string;
  role: UserRole;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is required");
  }
  return value;
}

export function signSession(value: string): string {
  const signature = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function verifySession(raw: string | undefined): boolean {
  if (!raw) return false;
  const [value, signature] = raw.split(".");
  if (!value || !signature) return false;
  const expected = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export const SESSION = {
  cookieName: SESSION_COOKIE
};

export function parseSessionValue(raw: string | undefined): string | null {
  if (!raw) return null;
  const [value] = raw.split(".");
  return value || null;
}

export function encodeSessionUser(user: SessionUser): string {
  return `${user.username}:${user.role}`;
}

export function decodeSessionUser(raw: string | undefined): SessionUser | null {
  if (!verifySession(raw)) {
    return null;
  }
  const payload = parseSessionValue(raw);
  if (!payload) {
    return null;
  }
  const [username, role] = payload.split(":");
  if (!username || (role !== "admin" && role !== "vendedor")) {
    return null;
  }
  return { username, role };
}
