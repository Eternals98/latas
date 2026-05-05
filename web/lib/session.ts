import { redirect } from "next/navigation";
import { getAccessTokenFromCookies } from "./auth";

export type UserRole = "admin" | "cashier";

export type SessionUser = {
  id: string;
  full_name: string;
  role: UserRole;
};

function backendUrl(): string {
  const base = (process.env.BACKEND_API_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("BACKEND_API_URL is required");
  return base;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  const response = await fetch(`${backendUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  return (await response.json()) as SessionUser;
}

export async function requireAdminSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}
