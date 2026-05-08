import { useEffect, useState } from 'react';

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier';
  default_company_id?: string;
};

type UseSessionInfoReturn = {
  session: UserSession | null;
  loading: boolean;
  error: string | null;
};

export function useSessionInfo(): UseSessionInfoReturn {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/auth/session', { cache: 'no-store' });

        if (response.status === 401) {
          setSession(null);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || 'Error loading session');
        }

        const data = await response.json();
        setSession(data as UserSession);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading session');
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  return {
    session,
    loading,
    error,
  };
}
