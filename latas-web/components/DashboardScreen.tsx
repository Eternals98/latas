'use client';

import React from 'react';
import { Card, Icon } from './Primitives';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export type DashboardScreenProps = {
  metrics: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    salesCount: number;
    chartData: Array<{ date: string; sales: number; revenue: number }>;
  };
  loading: boolean;
};

export const DashboardScreen = ({ metrics, loading }: DashboardScreenProps) => {
  if (loading) {
    return <div className="p-8 animate-pulse">Cargando métricas...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-paper-100">
      <h1 className="mb-8 text-4xl font-bold font-display text-ink-900">Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total ventas" value={metrics.totalSales} icon="receipt" />
        <MetricCard label="Ingresos" value={metrics.totalRevenue} icon="dollarSign" />
        <MetricCard label="Ticket promedio" value={metrics.averageTicket} icon="activity" />
        <MetricCard label="Transacciones" value={metrics.salesCount} icon="list" />
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-ink-900">Ventas últimos 30 días</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.chartData}>
            <CartesianGrid stroke="var(--border-default)" />
            <XAxis dataKey="date" stroke="var(--fg-2)" />
            <YAxis stroke="var(--fg-2)" />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="var(--brass-400)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-ink-900">{value.toLocaleString('es-CO')}</p>
      </div>
      <Icon name={icon as any} size={24} className="text-brass-400" />
    </div>
  </Card>
);