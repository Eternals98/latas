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