import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isJWTExpired, decodeJWT } from './auth';

const JWT_COOKIE  = 'auth_token';
const ROLE_COOKIE = 'user_role';

export interface SessionUser {
  id:    string;
  email: string;
  name:  string;
  role:  'admin' | 'cashier';
}

/**
 * Lee la sesión desde las cookies server-side.
 * Antes: devolvía id/email/name vacíos — ahora los extrae del JWT.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE)?.value;
  const role  = cookieStore.get(ROLE_COOKIE)?.value;

  if (!token || isJWTExpired(token)) return null;

  try {
    const decoded = decodeJWT<{
      sub:            string;
      email?:         string;
      user_metadata?: { full_name?: string };
    }>(token);

    return {
      id:    decoded.sub,
      email: decoded.email ?? '',
      name:  decoded.user_metadata?.full_name ?? decoded.email ?? 'Usuario',
      role:  (role as 'admin' | 'cashier') ?? 'cashier',
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(
  allowed: Array<'admin' | 'cashier'>,
): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowed.includes(session.role)) redirect('/unauthorized');
  return session;
}
