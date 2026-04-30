import { useEffect, useMemo, useState } from 'react'

import { ApiError } from '../services/httpClient'
import { exportVentas, listVentasByMonth } from '../services/ventasApi'
import type { TipoOption, VentaReporteItem } from '../types/venta'
import { formatMoney, parseMoney } from '../utils/money'

type SaleFilter = TipoOption | 'ambos'
type DateMode = 'dia' | 'rango' | 'mes'

interface DateInterval {
  start: string
  end: string
}

interface MethodSummary {
  metodo: string
  monto: number
  participacion: number
}

interface RecentPaymentItem {
  rowId: string
  ventaId: number
  codigoVenta: string
  metodo: string
  fecha: string
  monto: number
  estado: 'completado'
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function addDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function monthToInterval(value: string): DateInterval {
  const [yearText, monthText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const first = `${year}-${pad2(month)}-01`
  const endDate = new Date(year, month, 0)
  const last = `${year}-${pad2(month)}-${pad2(endDate.getDate())}`
  return { start: first, end: last }
}

function daysBetweenInclusive(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const millis = endDate.getTime() - startDate.getTime()
  return Math.floor(millis / 86400000) + 1
}

function computeCurrentInterval(
  dateMode: DateMode,
  singleDate: string,
  fromDate: string,
  toDate: string,
  selectedMonth: string,
): DateInterval {
  if (dateMode === 'dia') {
    const day = singleDate || new Date().toISOString().slice(0, 10)
    return { start: day, end: day }
  }

  if (dateMode === 'mes') {
    if (selectedMonth) {
      return monthToInterval(selectedMonth)
    }
    const now = new Date()
    return monthToInterval(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}`)
  }

  const start = fromDate || toDate || new Date().toISOString().slice(0, 10)
  const end = toDate || fromDate || start
  return { start, end }
}

function previousInterval(interval: DateInterval): DateInterval {
  const span = daysBetweenInclusive(interval.start, interval.end)
  const prevEnd = addDays(interval.start, -1)
  const prevStart = addDays(prevEnd, -(span - 1))
  return { start: prevStart, end: prevEnd }
}

function buildMonthKeysForRange(start: string, end: string): string[] {
  const [startYear, startMonth] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)
  const keys: string[] = []

  let year = startYear
  let month = startMonth
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${pad2(month)}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return keys
}

function inRange(dateIso: string, interval: DateInterval): boolean {
  return dateIso >= interval.start && dateIso <= interval.end
}

function formatDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-')
  return `${day}/${month}/${year}`
}

function formatRangeLabel(interval: DateInterval): string {
  const start = new Date(`${interval.start}T00:00:00`)
  const end = new Date(`${interval.end}T00:00:00`)
  const monthShort = (date: Date) => date.toLocaleString('es-CO', { month: 'short' }).replace('.', '')
  return `${start.getDate()} ${monthShort(start)} - ${end.getDate()} ${monthShort(end)} ${end.getFullYear()}`
}

function normalizeMethodKey(method: string): string {
  return method.toLowerCase().replaceAll('_', ' ').trim()
}

function methodIcon(method: string): string {
  const normalized = normalizeMethodKey(method)
  if (normalized.includes('nequi') || normalized.includes('daviplata')) {
    return 'smartphone'
  }
  if (normalized.includes('tarjeta')) {
    return 'credit_card'
  }
  if (normalized.includes('efectivo')) {
    return 'payments'
  }
  if (normalized.includes('otro')) {
    return 'more_horiz'
  }
  return 'account_balance'
}

function methodPalette(method: string): { chip: string; iconBox: string } {
  const normalized = normalizeMethodKey(method)
  if (normalized.includes('bancolombia')) {
    return { chip: 'text-blue-700', iconBox: 'bg-blue-50 text-blue-600' }
  }
  if (normalized.includes('bbva')) {
    return { chip: 'text-indigo-700', iconBox: 'bg-indigo-50 text-indigo-600' }
  }
  if (normalized.includes('davivienda') || normalized.includes('daviplata')) {
    return { chip: 'text-red-700', iconBox: 'bg-red-50 text-red-600' }
  }
  if (normalized.includes('efectivo')) {
    return { chip: 'text-emerald-700', iconBox: 'bg-emerald-50 text-emerald-600' }
  }
  if (normalized.includes('nequi')) {
    return { chip: 'text-violet-700', iconBox: 'bg-violet-50 text-violet-600' }
  }
  if (normalized.includes('tarjeta')) {
    return { chip: 'text-amber-700', iconBox: 'bg-amber-50 text-amber-600' }
  }
  return { chip: 'text-slate-700', iconBox: 'bg-slate-100 text-slate-600' }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function filterByTipo(item: VentaReporteItem, saleFilter: SaleFilter): boolean {
  return saleFilter === 'ambos' ? true : item.tipo === saleFilter
}

function groupByMethod(items: VentaReporteItem[]): MethodSummary[] {
  const totals = new Map<string, number>()
  for (const sale of items) {
    for (const payment of sale.pagos) {
      const amount = parseMoney(payment.monto)
      totals.set(payment.medio, (totals.get(payment.medio) ?? 0) + amount)
    }
  }
  const grandTotal = Array.from(totals.values()).reduce((acc, value) => acc + value, 0)
  return Array.from(totals.entries())
    .map(([metodo, monto]) => ({
      metodo,
      monto,
      participacion: grandTotal > 0 ? (monto / grandTotal) * 100 : 0,
    }))
    .sort((left, right) => right.monto - left.monto)
}

function flattenRecentPayments(items: VentaReporteItem[]): RecentPaymentItem[] {
  return items
    .flatMap((sale) =>
      sale.pagos.map((payment, index) => ({
        rowId: `${sale.id}-${payment.id}-${index}`,
        ventaId: sale.id,
        codigoVenta: sale.codigo_venta,
        metodo: payment.medio,
        fecha: sale.fecha,
        monto: parseMoney(payment.monto),
        estado: 'completado' as const,
      })),
    )
    .sort((left, right) => right.fecha.localeCompare(left.fecha))
}

export function IngresosPorMetodoPage() {
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('formal')
  const [dateMode, setDateMode] = useState<DateMode>('mes')
  const [singleDate, setSingleDate] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allSales, setAllSales] = useState<VentaReporteItem[]>([])

  const currentInterval = useMemo(
    () => computeCurrentInterval(dateMode, singleDate, fromDate, toDate, selectedMonth),
    [dateMode, singleDate, fromDate, toDate, selectedMonth],
  )
  const comparisonInterval = useMemo(
    () => previousInterval(currentInterval),
    [currentInterval],
  )

  useEffect(() => {
    if (currentInterval.start > currentInterval.end) {
      setError('El rango de fecha no es valido. La fecha inicial no puede ser mayor que la final.')
      setAllSales([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const loadStart = comparisonInterval.start
    const loadEnd = currentInterval.end
    const monthKeys = buildMonthKeysForRange(loadStart, loadEnd)
    const requests = monthKeys.map((key) => {
      const [anioText, mesText] = key.split('-')
      return listVentasByMonth({ anio: Number(anioText), mes: Number(mesText) })
    })

    Promise.all(requests)
      .then((responses) => {
        if (cancelled) {
          return
        }
        const dedup = new Map<number, VentaReporteItem>()
        for (const item of responses.flatMap((response) => response.items)) {
          dedup.set(item.id, item)
        }
        setAllSales(Array.from(dedup.values()))
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return
        }
        setAllSales([])
        setError(err instanceof ApiError ? err.message : 'No fue posible cargar el informe de pagos.')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [comparisonInterval.start, currentInterval.end])

  const filteredSales = useMemo(() => allSales.filter((item) => filterByTipo(item, saleFilter)), [allSales, saleFilter])
  const currentSales = useMemo(
    () => filteredSales.filter((item) => inRange(item.fecha, currentInterval)),
    [filteredSales, currentInterval],
  )
  const previousSales = useMemo(
    () => filteredSales.filter((item) => inRange(item.fecha, comparisonInterval)),
    [filteredSales, comparisonInterval],
  )

  const methodSummary = useMemo(() => groupByMethod(currentSales), [currentSales])
  const recentPayments = useMemo(() => flattenRecentPayments(currentSales).slice(0, 5), [currentSales])
  const currentTotal = useMemo(
    () => methodSummary.reduce((acc, item) => acc + item.monto, 0),
    [methodSummary],
  )
  const previousTotal = useMemo(
    () => previousSales.flatMap((sale) => sale.pagos).reduce((acc, payment) => acc + parseMoney(payment.monto), 0),
    [previousSales],
  )

  const deltaVsPrevious = useMemo(() => {
    if (previousTotal <= 0) {
      return currentTotal > 0 ? '+100.0%' : '0.0%'
    }
    const delta = ((currentTotal - previousTotal) / previousTotal) * 100
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}%`
  }, [currentTotal, previousTotal])

  const projectedMonthEnd = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    if (currentDay <= 0) {
      return currentTotal
    }
    return (currentTotal / currentDay) * daysInMonth
  }, [currentTotal])

  async function handleExport() {
    setIsExporting(true)
    try {
      if (saleFilter === 'ambos') {
        const formalBlob = await exportVentas({ tipo: 'formal' })
        triggerDownload(formalBlob, 'ingresos-metodo-formal.xlsx')
        const informalBlob = await exportVentas({ tipo: 'informal' })
        triggerDownload(informalBlob, 'ingresos-metodo-informal.xlsx')
      } else {
        const blob = await exportVentas({ tipo: saleFilter })
        triggerDownload(blob, `ingresos-metodo-${saleFilter}.xlsx`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible exportar el informe.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-6 md:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1">
          {([
            { key: 'formal', label: 'Venta Formal' },
            { key: 'informal', label: 'Venta Informal' },
            { key: 'ambos', label: 'Ambas' },
          ] as const).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSaleFilter(option.key)}
              className={`rounded-lg px-4 py-2 text-sm transition md:px-6 ${
                saleFilter === option.key
                  ? 'bg-white font-bold text-blue-700 shadow-sm'
                  : 'font-medium text-slate-600 hover:bg-white/60'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>{`Periodo: ${formatRangeLabel(currentInterval)}`}</span>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar a Excel'}</span>
          </button>
        </div>
      </div>

      {error && (
        <section className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section>
      )}

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold text-slate-700">
            Tipo de fecha
            <select
              value={dateMode}
              onChange={(event) => setDateMode(event.target.value as DateMode)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="dia">Dia especifico</option>
              <option value="rango">Rango de dias</option>
              <option value="mes">Mes especifico</option>
            </select>
          </label>

          {dateMode === 'dia' && (
            <label className="text-xs font-semibold text-slate-700">
              Dia
              <input
                type="date"
                value={singleDate}
                onChange={(event) => setSingleDate(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          )}

          {dateMode === 'rango' && (
            <>
              <label className="text-xs font-semibold text-slate-700">
                Desde
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Hasta
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </>
          )}

          {dateMode === 'mes' && (
            <label className="text-xs font-semibold text-slate-700">
              Mes
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/40 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Distribucion por Metodo</h2>
            <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>{`${deltaVsPrevious} vs intervalo ant.`}</span>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-12 border-b border-slate-100 px-2 pb-2 text-xs uppercase tracking-[0.08em] text-slate-400">
              <div className="col-span-6 md:col-span-8">Metodo de pago</div>
              <div className="col-span-3 md:col-span-2 text-right">Participacion</div>
              <div className="col-span-3 md:col-span-2 text-right">Monto total</div>
            </div>

            <div className="space-y-1 pt-2">
              {isLoading && <p className="px-2 py-5 text-sm text-slate-500">Cargando metodos...</p>}
              {!isLoading && methodSummary.length === 0 && (
                <p className="px-2 py-5 text-sm text-slate-500">No hay ingresos para los filtros seleccionados.</p>
              )}

              {!isLoading &&
                methodSummary.map((method) => {
                  const palette = methodPalette(method.metodo)
                  return (
                    <div key={method.metodo} className="grid grid-cols-12 items-center rounded-lg p-2 transition hover:bg-slate-50">
                      <div className="col-span-6 flex items-center gap-3 md:col-span-8">
                        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${palette.iconBox}`}>
                          <span className="material-symbols-outlined text-[18px]">{methodIcon(method.metodo)}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-800">{method.metodo}</span>
                      </div>
                      <div className="col-span-3 text-right text-sm font-bold text-slate-700 md:col-span-2">
                        {`${method.participacion.toFixed(1)}%`}
                      </div>
                      <div className={`col-span-3 text-right text-sm font-semibold md:col-span-2 ${palette.chip}`}>
                        {`$${formatMoney(method.monto)}`}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </section>

        <section className="space-y-4 xl:col-span-4">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">Transacciones recientes</h3>
              <span className="text-xs font-semibold text-blue-600">Ultimas</span>
            </div>

            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="space-y-4">
                {isLoading && <p className="text-sm text-slate-500">Cargando transacciones...</p>}
                {!isLoading && recentPayments.length === 0 && <p className="text-sm text-slate-500">Sin movimientos en este intervalo.</p>}

                {!isLoading &&
                  recentPayments.map((payment) => {
                    const palette = methodPalette(payment.metodo)
                    return (
                      <div key={payment.rowId} className="flex items-center gap-3">
                        <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${palette.iconBox}`}>
                          <span className="material-symbols-outlined text-[17px]">add_circle</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{`Venta #${payment.codigoVenta} - ${payment.metodo}`}</p>
                          <p className="text-xs text-slate-400">{formatDate(payment.fecha)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{`$${formatMoney(payment.monto)}`}</p>
                          <span className="text-[10px] font-bold uppercase text-emerald-600">Completado</span>
                        </div>
                      </div>
                    )
                  })}
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <p className="text-center text-[11px] text-slate-400">Balance neto proyectado para fin de mes</p>
                <p className="mt-1 text-center text-2xl font-semibold text-slate-900">{`$${formatMoney(projectedMonthEnd)}`}</p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: '75%' }} />
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-500">{`Acumulado actual: $${formatMoney(currentTotal)}`}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
