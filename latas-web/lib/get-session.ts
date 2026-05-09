// lib/get-session.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isJWTExpired } from "./auth";

const JWT_COOKIE_NAME = "auth_token";
const ROLE_COOKIE_NAME = "user_role";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "cashier";
}

/**
 * Obtiene la sesión actual
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const role = cookieStore.get(ROLE_COOKIE_NAME)?.value;

  if (!token || isJWTExpired(token)) return null;

  try {
    // El rol viene de la cookie (guardada después del login)
    return {
      id: "", // Se obtiene en el callback
      email: "",
      name: "",
      role: (role as "admin" | "cashier") || "cashier",
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(
  allowedRoles: ("admin" | "cashier")[]
): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) redirect("/unauthorized");
  return session;
}