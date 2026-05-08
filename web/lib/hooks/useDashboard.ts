import { useEffect, useState } from 'react';

export type DashboardApiResponse = {
  ventas_por_mes?: Array<{
    mes?: number;
    anio?: number;
    periodo?: string;
    cantidad_ventas?: number;
    valor_total?: string | number;
  }>;
  ventas_por_empresa?: Array<{
    empresa?: string;
    nombre_empresa?: string;
    cantidad_ventas?: string | number;
    volumen?: string | number;
    valor_total?: string | number;
    total?: string | number;
    ingresos?: string | number;
  }>;
  metodos_pago?: Array<{
    metodo?: string;
    medio?: string;
    transacciones?: string | number;
    cantidad?: string | number;
    cantidad_pagos?: string | number;
    monto_total?: string | number;
    total?: string | number;
  }>;
  total_ventas?: string | number;
  total_mes_actual?: string | number;
  cantidad_ventas?: string | number;
  ticket_promedio?: string | number;
  generado_en?: string;
};

type UseDashboardReturn = {
  data: DashboardApiResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/bff/dashboard', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`No se pudo cargar el dashboard (${response.status})`);
      }
      const payload = (await response.json()) as DashboardApiResponse;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      await fetchDashboard();
    };

    if (active) {
      void loadDashboard();
    }

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error, refetch: fetchDashboard };
}
