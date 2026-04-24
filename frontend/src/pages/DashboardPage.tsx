import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ApiError } from '../services/httpClient'
import { getDashboard } from '../services/dashboardApi'
import type { DashboardResponse } from '../types/dashboard'
import { formatMoney, parseMoney } from '../utils/money'

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#be123c']

function moneyLabel(value: string | number): string {
  return `$ ${formatMoney(value)}`
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </section>
  )
}

function EmptyPanel() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
      No hay ventas activas para graficar. Los indicadores apareceran cuando existan ventas registradas.
    </section>
  )
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getDashboard()
      .then((payload) => {
        if (!cancelled) {
          setDashboard(payload)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'No fue posible cargar el dashboard.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const monthlyData = useMemo(
    () =>
      dashboard?.ventas_por_mes.map((item) => ({
        ...item,
        valor: parseMoney(item.valor_total),
      })) ?? [],
    [dashboard],
  )
  const companyData = useMemo(
    () =>
      dashboard?.ventas_por_empresa.map((item) => ({
        ...item,
        valor: parseMoney(item.valor_total),
      })) ?? [],
    [dashboard],
  )
  const paymentData = useMemo(
    () =>
      dashboard?.metodos_pago.map((item) => ({
        ...item,
        valor: parseMoney(item.valor_total),
        porcentajeValor: parseMoney(item.porcentaje),
      })) ?? [],
    [dashboard],
  )

  const topCompany = companyData[0]
  const isEmpty = !dashboard || dashboard.cantidad_ventas === 0

  return (
    <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-950">Dashboard de Negocio</h1>
        <p className="text-sm text-slate-600">Indicadores de ventas activas calculados desde el backend.</p>
      </header>

      {isLoading && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Cargando dashboard...
        </section>
      )}

      {error && (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      )}

      {!isLoading && !error && dashboard && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ventas activas" value={moneyLabel(dashboard.total_ventas)} detail={`${dashboard.cantidad_ventas} ventas`} />
            <StatCard label="Mes actual" value={moneyLabel(dashboard.total_mes_actual)} />
            <StatCard label="Ticket promedio" value={moneyLabel(dashboard.ticket_promedio)} />
            <StatCard label="Empresa lider" value={topCompany?.empresa ?? 'Sin datos'} detail={topCompany ? moneyLabel(topCompany.valor_total) : undefined} />
          </div>

          {isEmpty ? (
            <EmptyPanel />
          ) : (
            <>
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900">Ventas por mes</h2>
                  <span className="text-xs text-slate-500">Total y cantidad activa</span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tick={{ fontSize: 12 }} width={48} />
                      <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                      <Line type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900">Ventas por empresa</h2>
                    <span className="text-xs text-slate-500">{companyData.length} empresas</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={companyData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="empresa" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tick={{ fontSize: 12 }} width={48} />
                        <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {companyData.map((entry, index) => (
                            <Cell key={entry.empresa} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <h2 className="text-base font-semibold text-slate-900">Metodos de pago</h2>
                    <p className="text-xs text-slate-500">Montos desde pagos de ventas activas</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentData} dataKey="valor" nameKey="medio" innerRadius={54} outerRadius={86} paddingAngle={2}>
                          {paymentData.map((entry, index) => (
                            <Cell key={entry.medio} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Medio</th>
                          <th className="px-3 py-2 text-right">Pagos</th>
                          <th className="px-3 py-2 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentData.map((item) => (
                          <tr key={item.medio}>
                            <td className="px-3 py-2 font-medium text-slate-800">{item.medio}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{item.cantidad_pagos}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{item.porcentaje}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  )
}
