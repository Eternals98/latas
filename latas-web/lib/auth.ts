import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

const JWT_COOKIE_NAME = "auth_token";

/**
 * Obtiene el JWT del servidor (seguro)
 */
export async function getJWTFromServer(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(JWT_COOKIE_NAME)?.value || null;
}

/**
 * Decodifica JWT sin validar (solo para cliente, datos públicos)
 */
export function decodeJWT<T = Record<string, unknown>>(token: string): T {
  try {
    return jwtDecode<T>(token);
  } catch {
    throw new Error("Token inválido");
  }
}

/**
 * Extrae user_id del JWT
 */
export function extractUserIdFromJWT(token: string): string {
  const decoded = decodeJWT<{ sub: string }>(token);
  return decoded.sub;
}

/**
 * Verifica si JWT expiró
 */
export function isJWTExpired(token: string): boolean {
  try {
    const decoded = decodeJWT<{ exp: number }>(token);
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Obtiene info del usuario desde JWT (cliente)
 */
export function getUserFromJWT(token: string) {
  const decoded = decodeJWT<{
    sub: string;
    email: string;
    user_metadata?: { full_name?: string };
  }>(token);

  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.user_metadata?.full_name || "Usuario",
  };
}