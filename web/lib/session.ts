import crypto from "crypto";

const SESSION_COOKIE = "latas_session";

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
