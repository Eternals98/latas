'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { Card, Icon, cn, fmtMoney } from '../../components/Primitives';
import { useDashboard, type DashboardApiResponse } from '../../lib/hooks';

type EntityRow = { name: string; volume: number; income: number };
type PaymentRow = { method: string; icon: string; transactions: number; total: number };

const MONTHS = [{ key: '2026-05', label: 'Mayo 2026' }];

function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CL').format(value);
}

function normalizeMethodIcon(method: string) {
  const normalized = method.toLowerCase();
  if (normalized.includes('efect')) return 'cash';
  if (normalized.includes('tarjeta') || normalized.includes('crédito') || normalized.includes('credito')) return 'creditCard';
  if (normalized.includes('transfer')) return 'creditCard';
  return 'creditCard';
}

function isCashMethod(method: string) {
  const normalized = method.toLowerCase();
  return normalized.includes('efect') || normalized.includes('cash');
}

function HeroFigure({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-6">
      <div className="text-[11px] tracking-widest uppercase font-semibold text-slate-500 mb-2">{label}</div>
      <div className="text-3xl font-bold text-ink-900 font-mono">{value}</div>
    </Card>
  );
}

function DataTable({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card padding={0} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-paper-50 px-6 py-4">
        <h2 className="text-[11px] tracking-widest uppercase font-bold text-slate-500">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function DashboardClientPage() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].key);
  const { data, loading, error } = useDashboard();

  const monthLabel = MONTHS.find((item) => item.key === selectedMonth)?.label ?? "Mayo 2026";

  const summary = useMemo(() => {
    const monthEntry = data?.ventas_por_mes?.find((row) => {
      if (row.periodo) {
        return row.periodo === selectedMonth;
      }
      if (typeof row.anio === "number" && typeof row.mes === "number") {
        return `${row.anio}-${String(row.mes).padStart(2, "0")}` === selectedMonth;
      }
      return false;
    });

    const entities: EntityRow[] = (data?.ventas_por_empresa ?? []).map((row) => ({
      name: row.empresa ?? row.nombre_empresa ?? "Sin nombre",
      volume: toNumber(row.cantidad_ventas ?? row.volumen),
      income: toNumber(row.valor_total ?? row.total ?? row.ingresos),
    }));

    const payments: PaymentRow[] = (data?.metodos_pago ?? []).map((row) => {
      const method = row.metodo ?? row.medio ?? "Desconocido";
      return {
        method,
        icon: normalizeMethodIcon(method),
        transactions: toNumber(row.transacciones ?? row.cantidad_pagos ?? row.cantidad),
        total: toNumber(row.monto_total ?? row.total),
      };
    });

    const cashTotal = payments.filter((row) => isCashMethod(row.method)).reduce((acc, row) => acc + row.total, 0);
    const monthTotal = toNumber(monthEntry?.valor_total);

    return {
      salesTotal: monthTotal || toNumber(data?.total_ventas),
      dailySales: monthTotal || toNumber(data?.total_mes_actual),
      cashTotal,
      entities,
      payments,
      ticketAverage: toNumber(data?.ticket_promedio),
      count: toNumber(data?.cantidad_ventas),
    };
  }, [data, selectedMonth]);

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] tracking-widest uppercase font-semibold text-slate-500 mb-2">Resumen General</div>
          <h1 className="font-display text-3xl text-ink-900">Resumen de Operaciones</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg">
            <Icon name="calendar" size={16} className="text-slate-500" />
            <label className="text-[11px] tracking-widest uppercase font-bold text-slate-500" htmlFor="month-filter">
              Mes
            </label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-w-[130px] border-0 bg-transparent p-0 text-sm font-semibold text-ink-900 outline-none"
            >
              {MONTHS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 p-4 bg-coral-50 border border-coral-200 rounded-lg text-sm text-coral-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <HeroFigure label="Ventas totales mes" value={loading ? '...' : fmtMoney(summary.salesTotal)} />
        <HeroFigure label="Ventas diarias" value={loading ? '...' : fmtMoney(summary.dailySales)} />
        <HeroFigure label="Efectivo total" value={loading ? '...' : fmtMoney(summary.cashTotal)} />
      </div>

      <div className="flex flex-col gap-6">
        <DataTable title="Distribución de ventas por entidad" action={<span className="text-[11px] tracking-widest uppercase font-medium text-slate-500">{monthLabel}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-paper-50">
                  <th className="px-6 py-3 text-left text-[11px] tracking-widest uppercase font-bold text-slate-500">Nombre de Empresa</th>
                  <th className="px-6 py-3 text-right text-[11px] tracking-widest uppercase font-bold text-slate-500">Volumen</th>
                  <th className="px-6 py-3 text-right text-[11px] tracking-widest uppercase font-bold text-slate-500">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(loading ? [] : summary.entities).map((row) => (
                  <tr key={row.name} className="hover:bg-paper-50 transition-colors">
                    <td className="px-6 py-3 text-ink-900 font-medium">{row.name}</td>
                    <td className="px-6 py-3 text-right text-ink-900 font-mono tabular-nums">{formatNumber(row.volume)}</td>
                    <td className="px-6 py-3 text-right text-ink-900 font-bold font-mono tabular-nums">{fmtMoney(row.income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>

        <DataTable title="Desglose por método de pago" action={<span className="text-[11px] tracking-widest uppercase font-medium text-slate-500">{monthLabel}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-paper-50">
                  <th className="px-6 py-3 text-left text-[11px] tracking-widest uppercase font-bold text-slate-500">Método</th>
                  <th className="px-6 py-3 text-right text-[11px] tracking-widest uppercase font-bold text-slate-500">Transacciones</th>
                  <th className="px-6 py-3 text-right text-[11px] tracking-widest uppercase font-bold text-slate-500">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(loading ? [] : summary.payments).map((row) => (
                  <tr key={row.method} className="hover:bg-paper-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Icon name={row.icon} size={16} className="text-slate-500" />
                        <span className="text-ink-900 font-medium">{row.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-ink-900 font-mono tabular-nums">{formatNumber(row.transactions)}</td>
                    <td className="px-6 py-3 text-right text-ink-900 font-bold font-mono tabular-nums">{fmtMoney(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      </div>
    </div>
  );
}
