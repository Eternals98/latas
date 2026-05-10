/**
 * Cliente HTTP del frontend.
 *
 * Flujo: hooks (cliente) → /api/bff/* (Next.js, server-side) → FastAPI backend
 *
 * El BFF lee la cookie HTTP-only y agrega "Authorization: Bearer" al llamar
 * FastAPI. NO llamar al backend directo desde el cliente — las cookies HTTP-only
 * no son accesibles en JS y FastAPI espera Bearer token, no cookies.
 */

const BFF_BASE = '/api/bff';

export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

const HTTP_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'No autenticado',
  403: 'No autorizado',
  404: 'No encontrado',
  409: 'Conflicto (posible duplicado)',
  422: 'Datos inválidos',
  500: 'Error del servidor',
  502: 'Error de conexión con el backend',
};

/** /api/sales  →  /api/bff/sales  (preserva query string) */
function toBffUrl(endpoint: string): string {
  const [pathPart, queryPart] = endpoint.split('?');
  const cleanPath = pathPart.replace(/^\/api\//, '');
  return `${BFF_BASE}/${cleanPath}${queryPart ? `?${queryPart}` : ''}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new BackendError(
      res.status,
      HTTP_MESSAGES[res.status] ?? `Error ${res.status}`,
      err?.detail,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** GET a través del BFF. */
export async function backendFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(toBffUrl(endpoint), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  return handleResponse<T>(res);
}

/** POST / PUT / PATCH a través del BFF. */
export async function backendMutate<T>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  payload?: unknown,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(toBffUrl(endpoint), {
    method,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    ...options,
  });
  return handleResponse<T>(res);
}

/** DELETE a través del BFF. */
export async function backendDelete<T = void>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(toBffUrl(endpoint), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  return handleResponse<T>(res);
}

// Alias backward-compat
export const throwBackendError = (status: number, detail?: string): never => {
  throw new BackendError(status, HTTP_MESSAGES[status] ?? `Error ${status}`, detail);
};
