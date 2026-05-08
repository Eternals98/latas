import { useCallback, useState } from 'react';
import { getCsrfHeaders } from '../csrf-client';

export type SalePayment = { payment_method_id: string; amount: number };

export type SaleCreateRequest = {
  company_id: string;
  customer_id?: string;
  transaction_date: string;
  document_number?: string;
  description: string;
  total_amount: number;
  payments: SalePayment[];
};

export type SaleCreateResponse = {
  id: string;
  document_number: string;
  created_at: string;
  total_amount: number;
};

export type SaleEditRequest = {
  description: string;
  transaction_date: string;
  payment_date?: string;
  company_id: string;
  payments: SalePayment[];
};

export type SaleCancelRequest = {
  reason: string;
  impact_cash: boolean;
};

type UseSalesReturn = {
  creating: boolean;
  cancelling: boolean;
  editing: boolean;
  error: string | null;
  success: boolean;
  createSale: (data: SaleCreateRequest) => Promise<SaleCreateResponse | null>;
  cancelSale: (saleId: string, data: SaleCancelRequest) => Promise<boolean>;
  editSale: (saleId: string, data: SaleEditRequest) => Promise<boolean>;
  reset: () => void;
};

export function useSales(): UseSalesReturn {
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createSale = useCallback(async (data: SaleCreateRequest): Promise<SaleCreateResponse | null> => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/bff/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(errorData.detail || `Error al crear la venta (${response.status})`);
      }

      const result = (await response.json()) as SaleCreateResponse;
      setSuccess(true);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al crear la venta';
      setError(message);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const cancelSale = useCallback(async (saleId: string, data: SaleCancelRequest): Promise<boolean> => {
    try {
      setCancelling(true);
      setError(null);

      const response = await fetch(`/api/bff/sales/${saleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const fallback = await response.text().catch(() => '');
        let detail = 'No fue posible anular la transacción.';
        try {
          const parsed = fallback ? (JSON.parse(fallback) as { detail?: string }) : null;
          if (parsed?.detail) detail = parsed.detail;
        } catch {
          if (fallback.trim()) detail = fallback.trim();
        }
        throw new Error(detail);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al anular la venta';
      setError(message);
      return false;
    } finally {
      setCancelling(false);
    }
  }, []);

  const editSale = useCallback(async (saleId: string, data: SaleEditRequest): Promise<boolean> => {
    try {
      setEditing(true);
      setError(null);

      const response = await fetch(`/api/bff/sales/${saleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const fallback = await response.text().catch(() => '');
        let detail = 'No fue posible editar la transacción.';
        try {
          const parsed = fallback ? (JSON.parse(fallback) as { detail?: string }) : null;
          if (parsed?.detail) detail = parsed.detail;
        } catch {
          if (fallback.trim()) detail = fallback.trim();
        }
        throw new Error(detail);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al editar la venta';
      setError(message);
      return false;
    } finally {
      setEditing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCreating(false);
    setCancelling(false);
    setEditing(false);
    setError(null);
    setSuccess(false);
  }, []);

  return { creating, cancelling, editing, error, success, createSale, cancelSale, editSale, reset };
}
