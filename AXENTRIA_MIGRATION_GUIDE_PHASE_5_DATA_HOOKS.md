# Axentria Design → Next.js Web
## PHASE 5: Data Hooks & State Management

**Versión:** 1.0  
**Duración:** 2-2.5 horas  
**Objetivo:** Crear hooks de datos para toda la lógica de negocio

---

## 📋 Tabla de Contenidos

1. [Patrón de Hooks](#patrón-de-hooks)
2. [Backend Client](#backend-client)
3. [useSales Hook](#usesales-hook)
4. [useCash Hook](#usecash-hook)
5. [useDashboard Hook](#usedashboard-hook)
6. [useTransactions Hook](#usetransactions-hook)
7. [useLookupData Hook](#uselookupdata-hook)
8. [useSessionInfo Hook](#usesessioninfo-hook)
9. [Error Handling](#error-handling)
10. [Checklist de Phase 5](#checklist)

---

## Patrón de Hooks

### Estructura base

Todos los hooks siguen este patrón:

```typescript
'use client';

import { useState, useCallback } from 'react';

export const useMyHook = () => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFromAPI(...);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const mutate = useCallback(async (payload: T) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutateAPI(payload);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch, mutate };
};
```

### Ventajas

- ✅ Componentes puros (sin lógica de datos)
- ✅ Reutilizable entre múltiples componentes
- ✅ Testing simplificado (mockear el hook)
- ✅ Error handling centralizado
- ✅ Loading states consistentes

---

## Backend Client

**`lib/backend.ts`:** Cliente HTTP para comunicarse con el backend

```typescript
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
```

---

## useSales Hook

**`lib/hooks/useSales.ts`:** Hook para gestionar ventas

```typescript
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
```

---

## useCash Hook

**`lib/hooks/useCash.ts`:** Hook para gestionar sesiones de caja

```typescript
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
```

---

## useDashboard Hook

**`lib/hooks/useDashboard.ts`:** Hook para métricas del dashboard

```typescript
'use client';

import { useState, useEffect } from 'react';
import { backendFetch } from '@/lib/backend';

export interface DashboardMetrics {
  total_sales: number;
  total_revenue: number;
  average_ticket: number;
  sales_count: number;
  sales_by_method: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  sales_by_company: Array<{
    company_id: string;
    company_name: string;
    count: number;
    total: number;
  }>;
  chart_data: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await backendFetch<DashboardMetrics>(
          '/api/dashboard'
        );
        setMetrics(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar métricas';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  return { metrics, loading, error };
};
```

---

## useTransactions Hook

**`lib/hooks/useTransactions.ts`:** Hook para historial de transacciones

```typescript
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
```

---

## useLookupData Hook

**`lib/hooks/useLookupData.ts`:** Hook para catálogos (empresas, clientes, métodos de pago)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { backendFetch } from '@/lib/backend';

export interface Company {
  id: string;
  name: string;
  document?: string;
}

export interface Customer {
  id: string;
  name: string;
  document?: string;
  email?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  requires_cash: boolean;
  active: boolean;
}

export const useLookupData = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [companiesData, customersData, methodsData] = await Promise.all([
          backendFetch<Company[]>('/api/companies'),
          backendFetch<Customer[]>('/api/customers'),
          backendFetch<PaymentMethod[]>('/api/payment-methods'),
        ]);

        setCompanies(companiesData);
        setCustomers(customersData);
        setPaymentMethods(methodsData.filter((m) => m.active));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar catálogos';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { companies, customers, paymentMethods, loading, error };
};
```

---

## useSessionInfo Hook

**`lib/hooks/useSessionInfo.ts`:** Hook para información del usuario

```typescript
'use client';

import { useState, useEffect } from 'react';
import { backendFetch } from '@/lib/backend';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier';
  company_id?: string;
  default_company_id?: string;
  created_at: string;
  last_login?: string;
}

export const useSessionInfo = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await backendFetch<UserProfile>('/api/auth/profile');
        setProfile(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return { profile, loading, error };
};
```

---

## Error Handling

### Patrones recomendados

**1. Limpiar errores después de cerrar diálogo:**

```typescript
const handleClose = () => {
  setError(null);
  setOpen(false);
};
```

**2. Mostrar errores con toasts:**

```typescript
const { error, createSale } = useSales();

const handleSubmit = async (payload) => {
  const result = await createSale(payload);
  if (!result) {
    toast.error(error || 'Error desconocido');
    return;
  }
  toast.success('Venta registrada');
};
```

**3. Manejar 404 específicamente:**

```typescript
try {
  const data = await backendFetch('/api/resource/123');
} catch (err) {
  if (err.message.includes('404')) {
    // Recurso no existe
    setNotFound(true);
  } else {
    setError(err.message);
  }
}
```

**4. Retry logic:**

```typescript
const loadWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await backendFetch('/api/data');
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

---

## Checklist

- [ ] `lib/backend.ts` creado con `backendFetch` y `backendMutate`
- [ ] `lib/hooks/useSales.ts` con createSale, editSale, cancelSale
- [ ] `lib/hooks/useCash.ts` con openCash, closeCash, recordWithdrawal
- [ ] `lib/hooks/useDashboard.ts` cargando métricas
- [ ] `lib/hooks/useTransactions.ts` con filtrado y paginación
- [ ] `lib/hooks/useLookupData.ts` precargando catálogos
- [ ] `lib/hooks/useSessionInfo.ts` obteniendo perfil del usuario
- [ ] Error handling consistente en todos los hooks
- [ ] Loading states claros
- [ ] TypeScript types para todos los datos
- [ ] Documentación JSDoc en funciones principales

---

**Estado:** ✅ Phase 5 Complete  
**Duración estimada:** 2-2.5 horas  
**Siguiente:** Phase 6 - Autenticación & Autorización
