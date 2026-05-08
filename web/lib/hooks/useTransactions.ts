import { useCallback, useEffect, useState } from 'react';

export type TransactionPayment = {
  id: string;
  payment_method_id: string;
  payment_method_name: string;
  amount: string;
};

export type Transaction = {
  id: string;
  company: { id: string; name: string };
  customer?: { id: string; name: string; phone?: string | null };
  transaction_date: string;
  payment_date?: string;
  payment_terms?: 'contado' | 'crédito';
  document_number?: string;
  description: string;
  total_amount: string;
  status: string;
  created_at: string;
  payments: TransactionPayment[];
};

export type TransactionListResponse = {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
};

type UseTransactionsReturn = {
  transactions: Transaction[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchTransactions: (filters?: {
    date_from?: string;
    date_to?: string;
    search?: string;
    company_ids?: string[];
    payment_method_ids?: string[];
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useTransactions(initialFilters?: { date_from?: string; date_to?: string; search?: string }): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (filters?: {
      date_from?: string;
      date_to?: string;
      search?: string;
      company_ids?: string[];
      payment_method_ids?: string[];
      limit?: number;
      offset?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        const mergedFilters = { ...initialFilters, ...filters };

        if (mergedFilters.date_from) params.append('date_from', mergedFilters.date_from);
        if (mergedFilters.date_to) params.append('date_to', mergedFilters.date_to);
        if (mergedFilters.search) params.append('search', mergedFilters.search);
        if (filters?.company_ids) {
          filters.company_ids.forEach((id) => params.append('company_ids', id));
        }
        if (filters?.payment_method_ids) {
          filters.payment_method_ids.forEach((id) => params.append('payment_method_ids', id));
        }
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(`/api/bff/sales?${params.toString()}`, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`Error al cargar transacciones (${response.status})`);
        }

        const data = (await response.json()) as TransactionListResponse;
        setTransactions(data.items);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar las transacciones');
      } finally {
        setLoading(false);
      }
    },
    [initialFilters]
  );

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, loading, error, fetchTransactions, refetch: () => fetchTransactions() };
}
