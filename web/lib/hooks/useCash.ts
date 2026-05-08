import { useCallback, useEffect, useState } from 'react';
import { getCsrfHeaders } from '../csrf-client';

export type CashMovement = {
  id: string;
  movement_type: 'open' | 'deposit' | 'withdrawal' | 'adjustment' | 'close';
  amount: number;
  description?: string;
  created_at: string;
};

export type CashSession = {
  id: string;
  session_date: string;
  status: 'open' | 'closed';
  opening_balance: number;
  total_sales_cash: number;
  total_withdrawals: number;
  current_balance: number;
  movements: CashMovement[];
};

type UseCashReturn = {
  session: CashSession | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  openCash: (opening_balance: number) => Promise<boolean>;
  closeCash: () => Promise<boolean>;
  recordWithdrawal: (amount: number, description: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

export function useCash(): UseCashReturn {
  const [session, setSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/bff/cash/today?session_date=${encodeURIComponent(today)}`,
        { cache: 'no-store' }
      );

      if (response.status === 404) {
        setSession(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Error fetching cash session');
      }

      const data = await response.json();
      setSession(data.session || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching cash session');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const openCash = useCallback(async (opening_balance: number): Promise<boolean> => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch('/api/bff/cash/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({ opening_balance }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Error opening cash');
      }

      await fetchSession();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error opening cash';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [fetchSession]);

  const closeCash = useCallback(async (): Promise<boolean> => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch('/api/bff/cash/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Error closing cash');
      }

      await fetchSession();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error closing cash';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [fetchSession]);

  const recordWithdrawal = useCallback(
    async (amount: number, description: string): Promise<boolean> => {
      try {
        setActionLoading(true);
        setError(null);

        const response = await fetch('/api/bff/cash/withdrawal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({ amount, description }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || 'Error recording withdrawal');
        }

        await fetchSession();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error recording withdrawal';
        setError(msg);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchSession]
  );

  return {
    session,
    loading,
    actionLoading,
    error,
    openCash,
    closeCash,
    recordWithdrawal,
    refresh: fetchSession,
  };
}
