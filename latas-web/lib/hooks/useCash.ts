'use client';

import { useState, useCallback, useEffect } from 'react';
import { backendFetch, backendMutate } from '@/lib/backend';

export interface CashMovement {
  id: string;
  type: 'open' | 'deposit' | 'withdrawal' | 'adjustment' | 'close';
  amount: number;
  description?: string;
  created_at: string;
}

export interface CashSession {
  id: string;
  status: 'open' | 'closed';
  opening_balance: number;
  total_sales_cash: number;
  total_withdrawals: number;
  current_balance: number;
  opened_at: string;
  closed_at?: string;
  movements: CashMovement[];
}

export const useCash = () => {
  const [session, setSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesión actual al montar
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await backendFetch<CashSession>('/api/cash/today');
        setSession(data);
      } catch (err) {
        // 404 es normal si no hay sesión abierta
        const message = err instanceof Error ? err.message : null;
        if (message && !message.includes('404')) {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const openCash = useCallback(
    async (openingBalance: number): Promise<boolean> => {
      setActionLoading(true);
      setError(null);

      try {
        const result = await backendMutate<CashSession>('/api/cash/open', 'POST', {
          opening_balance: openingBalance,
        });
        setSession(result);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al abrir caja';
        setError(message);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const closeCash = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await backendMutate<CashSession>('/api/cash/close', 'POST');
      setSession(result);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar caja';
      setError(message);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const recordWithdrawal = useCallback(
    async (amount: number, description: string): Promise<boolean> => {
      setActionLoading(true);
      setError(null);

      try {
        const result = await backendMutate<CashSession>(
          '/api/cash/withdrawal',
          'POST',
          { amount, description }
        );
        setSession(result);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al registrar retiro';
        setError(message);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  return {
    session,
    loading,
    actionLoading,
    error,
    openCash,
    closeCash,
    recordWithdrawal,
  };
};