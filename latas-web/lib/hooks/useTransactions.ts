'use client';

import { useState, useCallback, useEffect } from 'react';
import { backendFetch, backendMutate } from '@/lib/backend';

export interface Transaction {
  id: string;
  document_number?: string;
  description: string;
  transaction_date: string;
  total_amount: number;
  status: 'activo' | 'anulado';
  company_id: string;
  customer_id?: string;
  created_at: string;
  created_by: string;
  payments: Array<{
    payment_method_id: string;
    method_name: string;
    amount: number;
  }>;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  skip: number;
  limit: number;
}

export interface TransactionFilters {
  skip?: number;
  limit?: number;
  status?: 'activo' | 'anulado' | 'all';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadTransactions = useCallback(
    async (filters?: TransactionFilters) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters?.skip) params.append('skip', String(filters.skip));
        if (filters?.limit) params.append('limit', String(filters.limit));
        if (filters?.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters?.date_from) params.append('date_from', filters.date_from);
        if (filters?.date_to) params.append('date_to', filters.date_to);
        if (filters?.search) params.append('search', filters.search);

        const endpoint = `/api/transactions?${params.toString()}`;
        const data = await backendFetch<TransactionListResponse>(endpoint);

        setTransactions(data.items);
        setTotal(data.total);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar transacciones';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      setActionLoading(id);
      setError(null);

      try {
        await backendMutate(`/api/transactions/${id}/cancel`, 'POST');
        // Actualizar estado localmente
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'anulado' as const } : t))
        );
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cancelar transacción';
        setError(message);
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  const editTransaction = useCallback(
    async (
      id: string,
      updates: Partial<Transaction>
    ): Promise<boolean> => {
      setActionLoading(id);
      setError(null);

      try {
        const updated = await backendMutate<Transaction>(
          `/api/transactions/${id}`,
          'PUT',
          updates
        );
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar transacción';
        setError(message);
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  // Cargar al montar
  useEffect(() => {
    loadTransactions({ limit: 50 });
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    actionLoading,
    error,
    total,
    loadTransactions,
    cancelTransaction,
    editTransaction,
  };
};