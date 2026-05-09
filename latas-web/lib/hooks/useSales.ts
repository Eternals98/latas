'use client';

import { useState, useCallback } from 'react';
import { backendMutate } from '@/lib/backend';

export interface SalePayment {
  payment_method_id: string;
  amount: number;
}

export interface SaleCreateRequest {
  company_id: string;
  customer_id?: string;
  transaction_date: string;
  document_number?: string;
  description: string;
  total_amount: number;
  payments: SalePayment[];
}

export interface SaleResponse {
  id: string;
  document_number: string;
  status: 'activo' | 'anulado';
  company_id: string;
  customer_id?: string;
  transaction_date: string;
  description: string;
  total_amount: number;
  created_at: string;
  created_by: string;
}

export const useSales = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSale = useCallback(
    async (payload: SaleCreateRequest): Promise<SaleResponse | null> => {
      setCreating(true);
      setError(null);

      try {
        const result = await backendMutate<SaleResponse>('/api/sales', 'POST', payload);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear venta';
        setError(message);
        return null;
      } finally {
        setCreating(false);
      }
    },
    []
  );

  const editSale = useCallback(
    async (
      saleId: string,
      updates: Partial<SaleCreateRequest>
    ): Promise<SaleResponse | null> => {
      setCreating(true);
      setError(null);

      try {
        const result = await backendMutate<SaleResponse>(
          `/api/sales/${saleId}`,
          'PUT',
          updates
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar venta';
        setError(message);
        return null;
      } finally {
        setCreating(false);
      }
    },
    []
  );

  const cancelSale = useCallback(
    async (saleId: string): Promise<boolean> => {
      setCreating(true);
      setError(null);

      try {
        await backendMutate(`/api/sales/${saleId}/cancel`, 'POST');
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al anular venta';
        setError(message);
        return false;
      } finally {
        setCreating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { creating, error, createSale, editSale, cancelSale, reset };
};