"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

type DashboardApiResponse = {
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

type EntityRow = { name: string; volume: number; income: number };
type PaymentRow = { method: string; icon: string; transactions: number; total: number };

const MONTHS = [{ key: "2026-05", label: "Mayo 2026" }];

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function normalizeMethodIcon(method: string) {
  const normalized = method.toLowerCase();
  if (normalized.includes("efect")) return "payments";
  if (normalized.includes("tarjeta") || normalized.includes("crédito") || normalized.includes("credito")) return "credit_card";
  if (normalized.includes("transfer")) return "account_balance";
  return "payments";
}

function isCashMethod(method: string) {
  const normalized = method.toLowerCase();
  return normalized.includes("efect") || normalized.includes("cash");
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[84px] border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="h-full border-l-2 border-emerald-500 pl-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <p className="mt-4 text-[28px] font-semibold leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function TableShell({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#f7f9ff] px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardClientPage() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].key);
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/bff/dashboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`No se pudo cargar el dashboard (${response.status})`);
        }
        const payload = (await response.json()) as DashboardApiResponse;
        if (active) {
          setData(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Error desconocido al cargar el dashboard");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

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
    <main className="min-h-[calc(100vh-56px)] bg-[#f7f9ff] px-4 py-4 text-slate-900 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Panel general</p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[28px]">Resumen de Operaciones</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-[2px] border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
              <span className="material-symbols-outlined text-[17px] text-slate-500">calendar_month</span>
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500" htmlFor="month-filter">
                Mes
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="min-w-[130px] border-0 bg-transparent p-0 text-sm font-semibold text-slate-900 outline-none"
              >
                {MONTHS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button className="inline-flex h-9 items-center gap-2 bg-[#0054b8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00479d]">
              <span className="material-symbols-outlined text-[17px]">bar_chart</span>
              Ver Reportes
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Ventas totales mes" value={loading ? "Cargando..." : formatCurrency(summary.salesTotal)} />
          <MetricCard label="Ventas diarias" value={loading ? "Cargando..." : formatCurrency(summary.dailySales)} />
          <MetricCard label="Efectivo total" value={loading ? "Cargando..." : formatCurrency(summary.cashTotal)} />
        </div>

        <div className="mt-5 grid gap-4">
          <TableShell title="Distribución de ventas por entidad" action={<span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">{monthLabel}</span>}>
            <div className="overflow-hidden">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#fbfcff]">
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">Nombre de Empresa</th>
                    <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">Volumen</th>
                    <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(loading ? [] : summary.entities).map((row, index) => (
                    <tr key={row.name} className={index === 0 ? "bg-white" : "bg-[#fcfdff]"}>
                      <td className="px-4 py-3 text-left text-[14px] text-slate-700">{row.name}</td>
                      <td className="px-4 py-3 text-right text-[14px] text-slate-700 tabular-nums">{formatNumber(row.volume)}</td>
                      <td className="px-4 py-3 text-right text-[14px] font-semibold text-slate-900 tabular-nums">{formatCurrency(row.income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableShell>

          <TableShell title="Desglose por método de pago" action={<span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">{monthLabel}</span>}>
            <div className="overflow-hidden">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#fbfcff]">
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">Método</th>
                    <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">Transacciones</th>
                    <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">Monto Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(loading ? [] : summary.payments).map((row, index) => (
                    <tr key={row.method} className={index === 0 ? "bg-white" : "bg-[#fcfdff]"}>
                      <td className="px-4 py-3 text-left">
                        <div className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                            <span className="material-symbols-outlined text-[16px] text-slate-600">{row.icon}</span>
                          </span>
                          <span>{row.method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[14px] text-slate-700 tabular-nums">{formatNumber(row.transactions)}</td>
                      <td className="px-4 py-3 text-right text-[14px] font-semibold text-slate-900 tabular-nums">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableShell>
        </div>
      </div>
    </main>
  );
}
