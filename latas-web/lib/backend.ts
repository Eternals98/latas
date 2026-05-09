import { cache } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface BackendError {
  status: number;
  message: string;
  detail?: string;
}

export const throwBackendError = (status: number, detail?: string): never => {
  const message = {
    400: 'Solicitud inválida',
    401: 'No autenticado',
    403: 'No autorizado',
    404: 'No encontrado',
    409: 'Conflicto (posible duplicado)',
    500: 'Error del servidor',
  }[status] || `Error ${status}`;

  throw new Error(detail || message);
};

/**
 * Petición GET hacia el backend
 */
export const backendFetch = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${BACKEND_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throwBackendError(response.status, errorData.detail || errorData.message);
  }

  return response.json() as Promise<T>;
};

/**
 * Petición con datos (POST, PUT, PATCH)
 */
export const backendMutate = async <T = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  payload?: any,
  options?: RequestInit
): Promise<T> => {
  const url = `${BACKEND_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    body: payload ? JSON.stringify(payload) : undefined,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throwBackendError(response.status, errorData.detail || errorData.message);
  }

  return response.json() as Promise<T>;
};

/**
 * Cache simple en cliente (react cache)
 */
export const cachedFetch = cache(backendFetch);