export type AppRole = 'admin' | 'vendedor'

export interface AppSession {
  username: string
  role: AppRole
}

const SESSION_KEY = 'latas_frontend_session'

export function readSession(): AppSession | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppSession>
    if (!parsed.username || (parsed.role !== 'admin' && parsed.role !== 'vendedor')) {
      return null
    }
    return { username: parsed.username, role: parsed.role }
  } catch {
    return null
  }
}

export function writeSession(session: AppSession): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(SESSION_KEY)
}

export function authenticate(username: string, password: string): AppSession | null {
  const user = username.trim().toLowerCase()
  if (user === 'admin' && password === 'admin') {
    return { username: 'admin', role: 'admin' }
  }
  if (user === 'vendedor' && password === 'vendedor') {
    return { username: 'vendedor', role: 'vendedor' }
  }
  return null
}
