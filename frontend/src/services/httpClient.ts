import type { ApiErrorPayload } from '../types/venta'

const DEFAULT_API_URL = 'http://localhost:8000'
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as Partial<ApiErrorPayload>
    return payload.detail || `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status)
  }

  return (await response.json()) as T
}

export const httpClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },
  post<T, TBody>(path: string, body: TBody): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}