import { useEffect, useMemo, useState } from 'react'

import { EMPRESA_OPTIONS } from '../constants/ventaOptions'
import { searchClientes } from '../services/clientesApi'
import { ApiError } from '../services/httpClient'
import { listMediosPago } from '../services/mediosPagoApi'
import { adminLogin, annulVenta, exportVentas, importVentasExcel, listVentasByMonth, updateVenta } from '../services/ventasApi'
import type {
  AdminLoginRequest,
  ClienteResponse,
  EmpresaOption,
  MedioPagoResponse,
  TipoOption,
  VentaReporteItem,
} from '../types/venta'
import { formatMoney, parseMoney, toMoneyPayload } from '../utils/money'

type SaleFilter = TipoOption | 'ambos'
type DateMode = 'dia' | 'rango' | 'mes'
type TableViewMode = 'detallada' | 'consolidada'

interface DateInterval {
  start: string
  end: string
}

interface EditPaymentDraft {
  rowId: string
  medio: string
  monto: string
}

interface TransactionItem {
  rowId: string
  ventaId: number
  codigoVenta: string
  cliente: string
  iniciales: string
  metodo: string
  fechaIso: string
  monto: number
  descripcion: string
  referencia: string
  raw: VentaReporteItem
}

interface EditDraft {
  id: number
  empresa: EmpresaOption
  tipo: TipoOption
  fecha: string
  referencia: string
  descripcion: string
  valorTotal: string
  clienteId: number | null
  clienteQuery: string
  pagos: EditPaymentDraft[]
}

interface ViewDraft {
  id: number
  codigoVenta: string
  cliente: string
  tipo: TipoOption
  fecha: string
  referencia: string
  descripcion: string
  valorTotal: string
  pagos: Array<{ medio: string; monto: string }>
}

interface TransaccionesPageProps {
  embedded?: boolean
  onGoDashboard?: () => void
  onGoRegistro?: () => void
  onGoClientes?: () => void
  onGoReportes?: () => void
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function addDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function daysBetweenInclusive(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const millis = endDate.getTime() - startDate.getTime()
  return Math.floor(millis / 86400000) + 1
}

function monthYearFromIso(dateIso: string): { mes: number; anio: number } {
  const [year, month] = dateIso.split('-')
  return { mes: Number(month), anio: Number(year) }
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
  const startMonth = monthYearFromIso(start)
  const endMonth = monthYearFromIso(end)
  const keys: string[] = []
  let year = startMonth.anio
  let month = startMonth.mes

  while (year < endMonth.anio || (year === endMonth.anio && month <= endMonth.mes)) {
    keys.push(`${year}-${pad2(month)}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return keys
}

function formatDateDisplay(dateIso: string): string {
  const [year, month, day] = dateIso.split('-')
  return `${day}/${month}/${year}`
}

function normalizeMethodKey(method: string): string {
  return method.toLowerCase().replaceAll('_', ' ').trim()
}

function methodIcon(method: string): string {
  const normalized = normalizeMethodKey(method)
  if (normalized.includes('multiples')) {
    return 'layers'
  }
  if (normalized.includes('transfer')) {
    return 'account_balance'
  }
  if (normalized.includes('tarjeta') || normalized.includes('card')) {
    return 'credit_card'
  }
  return 'payments'
}

function paymentMethodClasses(method: string): string {
  const normalized = normalizeMethodKey(method)
  if (normalized.includes('multiples')) {
    return 'bg-slate-200 text-slate-700'
  }
  if (normalized.includes('bancolombia')) {
    return 'bg-blue-100 text-blue-800'
  }
  if (normalized.includes('nequi')) {
    return 'bg-fuchsia-100 text-fuchsia-800'
  }
  if (normalized.includes('daviplata')) {
    return 'bg-orange-100 text-orange-800'
  }
  if (normalized.includes('tarjeta')) {
    return 'bg-violet-100 text-violet-800'
  }
  if (normalized.includes('efectivo')) {
    return 'bg-emerald-100 text-emerald-800'
  }
  return 'bg-slate-100 text-slate-700'
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'NA'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function applySaleFilter(item: VentaReporteItem, saleFilter: SaleFilter): boolean {
  return saleFilter === 'ambos' ? true : item.tipo === saleFilter
}

function toConsolidatedItem(item: VentaReporteItem): TransactionItem {
  const cliente = item.cliente?.nombre?.trim() || item.empresa || 'Sin cliente'
  const metodo = item.pagos.length > 1 ? 'Multiples' : item.pagos[0]?.medio || 'Sin metodo'
  return {
    rowId: `v-${item.id}`,
    ventaId: item.id,
    codigoVenta: item.codigo_venta,
    cliente,
    iniciales: buildInitials(cliente),
    metodo,
    fechaIso: item.fecha,
    monto: parseMoney(item.valor_total),
    descripcion: item.descripcion,
    referencia: item.numero_referencia,
    raw: item,
  }
}

function toDetailedItems(item: VentaReporteItem): TransactionItem[] {
  const cliente = item.cliente?.nombre?.trim() || item.empresa || 'Sin cliente'
  if (item.pagos.length === 0) {
    return [
      {
        rowId: `v-${item.id}-p-empty`,
        ventaId: item.id,
        codigoVenta: item.codigo_venta,
        cliente,
        iniciales: buildInitials(cliente),
        metodo: 'Sin metodo',
        fechaIso: item.fecha,
        monto: parseMoney(item.valor_total),
        descripcion: item.descripcion,
        referencia: item.numero_referencia,
        raw: item,
      },
    ]
  }

  return item.pagos.map((pago) => ({
    rowId: `v-${item.id}-p-${pago.id}`,
    ventaId: item.id,
    codigoVenta: item.codigo_venta,
    cliente,
    iniciales: buildInitials(cliente),
    metodo: pago.medio,
    fechaIso: item.fecha,
    monto: parseMoney(pago.monto),
    descripcion: item.descripcion,
    referencia: item.numero_referencia,
    raw: item,
  }))
}

function toTransactionItems(items: VentaReporteItem[], mode: TableViewMode): TransactionItem[] {
  const sorted = [...items].sort((left, right) => right.fecha.localeCompare(left.fecha))
  if (mode === 'consolidada') {
    return sorted.map(toConsolidatedItem)
  }
  return sorted.flatMap(toDetailedItems)
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

function inRange(dateIso: string, interval: DateInterval): boolean {
  return dateIso >= interval.start && dateIso <= interval.end
}

function deltaLabel(current: number, previous: number): string {
  if (previous === 0) {
    return current === 0 ? 'Sin variacion' : 'Sin base previa'
  }
  const delta = ((current - previous) / previous) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}% vs periodo anterior`
}

function asEmpresaOption(value: string): EmpresaOption {
  if (value === 'generico') {
    return 'generico'
  }
  return value === 'tomas_gomez' ? 'tomas_gomez' : 'latas_sas'
}

function buildDefaultEditPayment(): EditPaymentDraft {
  return { rowId: `new-${Date.now()}-${Math.random()}`, medio: '', monto: '' }
}

export function TransaccionesPage({
  embedded = false,
  onGoDashboard,
  onGoRegistro,
  onGoClientes,
  onGoReportes,
}: TransaccionesPageProps) {
  const [search, setSearch] = useState('')
  const [dateMode, setDateMode] = useState<DateMode>('mes')
  const [singleDate, setSingleDate] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('ambos')
  const [tableViewMode, setTableViewMode] = useState<TableViewMode>('detallada')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [allSales, setAllSales] = useState<VentaReporteItem[]>([])
  const [paymentMethods, setPaymentMethods] = useState<MedioPagoResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importMonth, setImportMonth] = useState<number>(new Date().getMonth() + 1)
  const [importYear, setImportYear] = useState<number>(new Date().getFullYear())
  const [importTipoDefault, setImportTipoDefault] = useState<TipoOption>('informal')
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [adminToken, setAdminToken] = useState('')
  const [sessionRole, setSessionRole] = useState<'admin' | 'vendedor' | null>(null)
  const [editing, setEditing] = useState<EditDraft | null>(null)
  const [viewing, setViewing] = useState<ViewDraft | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editClienteSuggestions, setEditClienteSuggestions] = useState<ClienteResponse[]>([])
  const [isLoadingEditClientes, setIsLoadingEditClientes] = useState(false)
  const [activeInterval, setActiveInterval] = useState<DateInterval>(() =>
    computeCurrentInterval('mes', '', '', '', ''),
  )
  const [comparisonInterval, setComparisonInterval] = useState<DateInterval>(() =>
    previousInterval(computeCurrentInterval('mes', '', '', '', '')),
  )

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session')
      .then((response) => response.json())
      .then((payload: { role?: 'admin' | 'vendedor' }) => {
        if (!cancelled) {
          setSessionRole(payload.role ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessionRole(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listMediosPago()
      .then((items) => {
        if (!cancelled) {
          setPaymentMethods(items.filter((item) => item.activo))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentMethods([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const query = editing?.clienteQuery?.trim() ?? ''
    if (!editing || query.length < 1) {
      setEditClienteSuggestions([])
      setIsLoadingEditClientes(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoadingEditClientes(true)
      try {
        const items = await searchClientes(query)
        setEditClienteSuggestions(items)
      } catch {
        setEditClienteSuggestions([])
      } finally {
        setIsLoadingEditClientes(false)
      }
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [editing?.clienteQuery, editing?.id])

  useEffect(() => {
    const current = computeCurrentInterval(dateMode, singleDate, fromDate, toDate, selectedMonth)
    if (current.start > current.end) {
      setError('El rango de fecha no es valido. La fecha inicial no puede ser mayor que la final.')
      setAllSales([])
      setIsLoading(false)
      return
    }

    const previous = previousInterval(current)
    const loadStart = previous.start < current.start ? previous.start : current.start
    const loadEnd = previous.end > current.end ? previous.end : current.end
    const monthKeys = buildMonthKeysForRange(loadStart, loadEnd)

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setActiveInterval(current)
    setComparisonInterval(previous)

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
          if (!applySaleFilter(item, saleFilter)) {
            continue
          }
          dedup.set(item.id, item)
        }
        setAllSales(Array.from(dedup.values()))
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return
        }
        setAllSales([])
        setError(err instanceof ApiError ? err.message : 'No fue posible cargar las transacciones.')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dateMode, singleDate, fromDate, toDate, selectedMonth, saleFilter, reloadTick])

  const currentIntervalSales = useMemo(
    () => allSales.filter((item) => inRange(item.fecha, activeInterval)),
    [activeInterval, allSales],
  )
  const previousIntervalSales = useMemo(
    () => allSales.filter((item) => inRange(item.fecha, comparisonInterval)),
    [allSales, comparisonInterval],
  )

  const currentIntervalRows = useMemo(
    () => toTransactionItems(currentIntervalSales, tableViewMode),
    [currentIntervalSales, tableViewMode],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return currentIntervalRows.filter((item) => {
      if (query.length === 0) {
        return true
      }
      return (
        item.cliente.toLowerCase().includes(query) ||
        item.descripcion.toLowerCase().includes(query) ||
        item.referencia.toLowerCase().includes(query) ||
        item.codigoVenta.toLowerCase().includes(query) ||
        item.ventaId.toString().includes(query)
      )
    })
  }, [currentIntervalRows, search])

  const currentTotal = currentIntervalSales.reduce((acc, item) => acc + parseMoney(item.valor_total), 0)
  const previousTotal = previousIntervalSales.reduce((acc, item) => acc + parseMoney(item.valor_total), 0)
  const currentCount = currentIntervalSales.length
  const previousCount = previousIntervalSales.length

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [currentPage, filtered, pageSize])

  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = filtered.length === 0 ? 0 : Math.min(currentPage * pageSize, filtered.length)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      if (saleFilter === 'ambos') {
        const formalBlob = await exportVentas({ tipo: 'formal' })
        triggerDownload(formalBlob, 'ventas-formal.xlsx')
        const informalBlob = await exportVentas({ tipo: 'informal' })
        triggerDownload(informalBlob, 'ventas-informal.xlsx')
      } else {
        const blob = await exportVentas({ tipo: saleFilter })
        triggerDownload(blob, `ventas-${saleFilter}.xlsx`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible descargar el archivo.')
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleImportExcel(tokenOverride?: string) {
    if (!importFile) {
      setError('Selecciona un archivo Excel para importar.')
      return
    }

    const tokenToUse = tokenOverride || adminToken
    if (!tokenToUse) {
      setError('Debes autenticarte como administrador para importar.')
      return
    }

    setIsImporting(true)
    setError(null)
    setImportSummary(null)
    try {
      const result = await importVentasExcel(
        {
          archivo: importFile,
          mes: importMonth,
          anio: importYear,
          tipo_default: importTipoDefault,
        },
        tokenToUse,
      )
      setImportSummary(
        `Importacion completada. Creadas: ${result.creadas}, omitidas: ${result.omitidas}, hojas procesadas: ${result.hojas_procesadas}.`,
      )
      setReloadTick((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible importar el archivo.')
    } finally {
      setIsImporting(false)
    }
  }

  async function getAdminToken(): Promise<string> {
    if (adminToken) {
      return adminToken
    }
    const payload: AdminLoginRequest = { username: 'admin', password: 'admin' }
    const token = await adminLogin(payload)
    setAdminToken(token.access_token)
    return token.access_token
  }

  function openEdit(item: TransactionItem) {
    setEditing({
      id: item.ventaId,
      empresa: asEmpresaOption(item.raw.empresa),
      tipo: item.raw.tipo,
      fecha: item.raw.fecha,
      referencia: item.raw.numero_referencia,
      descripcion: item.raw.descripcion,
      valorTotal: toMoneyPayload(item.raw.valor_total),
      clienteId: item.raw.cliente?.id ?? null,
      clienteQuery: item.raw.cliente?.nombre ?? '',
      pagos:
        item.raw.pagos.length > 0
          ? item.raw.pagos.map((pago) => ({
              rowId: `edit-${pago.id}`,
              medio: pago.medio,
              monto: toMoneyPayload(pago.monto),
            }))
          : [buildDefaultEditPayment()],
    })
    setEditClienteSuggestions([])
  }

  function openView(item: TransactionItem) {
    setViewing({
      id: item.ventaId,
      codigoVenta: item.codigoVenta,
      cliente: item.cliente,
      tipo: item.raw.tipo,
      fecha: item.raw.fecha,
      referencia: item.raw.numero_referencia,
      descripcion: item.raw.descripcion,
      valorTotal: toMoneyPayload(item.raw.valor_total),
      pagos: item.raw.pagos.map((pago) => ({
        medio: pago.medio,
        monto: toMoneyPayload(pago.monto),
      })),
    })
  }

  function startEditWithAuth(item: TransactionItem) {
    if (sessionRole !== 'admin') {
      setError('Solo el usuario admin puede editar o eliminar transacciones.')
      return
    }
    openEdit(item)
  }

  function updateEditPayment(rowId: string, changes: Partial<EditPaymentDraft>) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            pagos: prev.pagos.map((pago) => (pago.rowId === rowId ? { ...pago, ...changes } : pago)),
          }
        : prev,
    )
  }

  function addEditPayment() {
    setEditing((prev) => (prev ? { ...prev, pagos: [...prev.pagos, buildDefaultEditPayment()] } : prev))
  }

  function updateEditClienteQuery(query: string) {
    setEditing((prev) => (prev ? { ...prev, clienteQuery: query, clienteId: null } : prev))
  }

  function selectEditCliente(cliente: ClienteResponse) {
    setEditing((prev) => (prev ? { ...prev, clienteId: cliente.id, clienteQuery: cliente.nombre } : prev))
    setEditClienteSuggestions([])
  }

  function removeEditPayment(rowId: string) {
    setEditing((prev) => {
      if (!prev) {
        return prev
      }
      const next = prev.pagos.filter((pago) => pago.rowId !== rowId)
      return { ...prev, pagos: next.length > 0 ? next : [buildDefaultEditPayment()] }
    })
  }

  async function saveEdit() {
    if (!editing) {
      return
    }

    const pagosPayload = editing.pagos
      .filter((pago) => pago.medio.trim() && parseMoney(pago.monto) > 0)
      .map((pago) => ({
        medio: pago.medio.trim(),
        monto: toMoneyPayload(pago.monto),
      }))

    if (
      !editing.descripcion.trim() ||
      !editing.referencia.trim() ||
      !editing.fecha ||
      !editing.valorTotal ||
      pagosPayload.length === 0
    ) {
      setError('Completa descripcion, referencia, fecha, total y al menos una forma de pago valida.')
      return
    }

    const total = parseMoney(editing.valorTotal)
    const pagosTotal = pagosPayload.reduce((acc, pago) => acc + parseMoney(pago.monto), 0)
    if (total <= 0) {
      setError('El valor total debe ser mayor que cero.')
      return
    }
    if (Number((pagosTotal - total).toFixed(2)) !== 0) {
      setError('La suma de formas de pago debe coincidir con el valor total.')
      return
    }

    setIsSavingEdit(true)
    setError(null)

    try {
      const token = await getAdminToken()
      await updateVenta(
        editing.id,
        {
          empresa: editing.empresa,
          tipo: editing.tipo,
          fecha_venta: editing.fecha,
          numero_referencia: editing.referencia.trim(),
          descripcion: editing.descripcion.trim(),
          valor_total: toMoneyPayload(editing.valorTotal),
          cliente_id: editing.clienteId,
          pagos: pagosPayload,
        },
        token,
      )
      setEditing(null)
      setReloadTick((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No fue posible editar la venta.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function deleteVenta(ventaId: number) {
    if (sessionRole !== 'admin') {
      setError('Solo el usuario admin puede eliminar transacciones.')
      return
    }
    const confirmed = window.confirm('Esta acción eliminará la transacción. ¿Deseas continuar?')
    if (!confirmed) {
      return
    }
    setError(null)
    try {
      const token = await getAdminToken()
      await annulVenta(ventaId, token)
      setReloadTick((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No fue posible eliminar la venta.')
    }
  }

  return (
    <div className="min-h-screen bg-[#eceef4] text-slate-900">
      {!embedded && (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-5">
            <h1 className="font-manrope text-lg font-extrabold tracking-tight text-blue-600">Libro de ventas</h1>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              aria-label="Descargar transacciones"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </header>
      )}

      <div className="flex">
        {!embedded && (
          <aside className="hidden h-screen w-[170px] shrink-0 border-r border-slate-200 bg-[#f5f6fa] px-3 pt-14 lg:block">
            <nav className="mt-3 space-y-1">
              <button
                type="button"
                onClick={onGoDashboard}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                Dashboard
              </button>
              <button
                type="button"
                onClick={onGoRegistro}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[16px]">receipt</span>
                Registrar venta
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md bg-blue-50 px-2 py-2 text-left text-xs font-bold text-blue-700"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Transacciones
              </button>
              <button
                type="button"
                onClick={onGoReportes}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-400"
              >
                <span className="material-symbols-outlined text-[16px]">analytics</span>
                Reportes
              </button>
            </nav>
          </aside>
        )}

        <main className={`w-full px-4 pb-24 ${embedded ? 'pt-6' : 'pt-20 lg:pl-6 lg:pr-6'}`}>
          <div className="mx-auto max-w-[1300px]">
            <section className="grid gap-4 lg:grid-cols-[minmax(240px,20%)_minmax(0,80%)]">
              <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-fit">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Filtros</p>
                <div className="mt-3 space-y-4">
                  <label className="block text-xs font-semibold text-slate-700">
                    Buscar
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Cliente, ID o factura"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-slate-700">
                    Tipo de fecha
                    <select
                      value={dateMode}
                      onChange={(event) => {
                        setDateMode(event.target.value as DateMode)
                        setCurrentPage(1)
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="dia">Dia especifico</option>
                      <option value="rango">Rango de dias</option>
                      <option value="mes">Mes especifico</option>
                    </select>
                  </label>

                  {dateMode === 'dia' && (
                    <label className="block text-xs font-semibold text-slate-700">
                      Dia
                      <input
                        type="date"
                        value={singleDate}
                        onChange={(event) => {
                          setSingleDate(event.target.value)
                          setCurrentPage(1)
                        }}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  )}

                  {dateMode === 'rango' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Desde
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(event) => {
                            setFromDate(event.target.value)
                            setCurrentPage(1)
                          }}
                          className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-slate-700">
                        Hasta
                        <input
                          type="date"
                          value={toDate}
                          onChange={(event) => {
                            setToDate(event.target.value)
                            setCurrentPage(1)
                          }}
                          className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                  )}

                  {dateMode === 'mes' && (
                    <label className="block text-xs font-semibold text-slate-700">
                      Mes
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(event) => {
                          setSelectedMonth(event.target.value)
                          setCurrentPage(1)
                        }}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-slate-700">Tipo de venta</p>
                    <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                      {(['ambos', 'formal', 'informal'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSaleFilter(option)
                            setCurrentPage(1)
                          }}
                          className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                            saleFilter === option ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-white/60'
                          }`}
                        >
                          {option === 'ambos' ? 'Ambos' : option === 'formal' ? 'Formal' : 'Informal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-700">Vista</p>
                    <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                      {(['detallada', 'consolidada'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTableViewMode(option)
                            setCurrentPage(1)
                          }}
                          className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                            tableViewMode === option ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-white/60'
                          }`}
                        >
                          {option === 'detallada' ? 'Detallada' : 'Consolidado'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              <section className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total periodo</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{`$${formatMoney(currentTotal)}`}</p>
                    <p className="text-xs text-slate-500">{deltaLabel(currentTotal, previousTotal)}</p>
                  </article>
                  <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Ventas periodo</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{currentCount}</p>
                    <p className="text-xs text-slate-500">{deltaLabel(currentCount, previousCount)}</p>
                  </article>
                </div>

                {sessionRole === 'admin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportModalOpen(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      Cargar Excel historico
                    </button>
                  </div>
                )}

                {error && (
                  <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section>
                )}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1080px] border-collapse text-left">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">ID</th>
                          <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Cliente</th>
                          <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Metodo</th>
                          <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Fecha</th>
                          <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Monto</th>
                          <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Descripcion</th>
                          <th className="px-5 py-4 text-right text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Acciones</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {isLoading && (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                              Cargando transacciones...
                            </td>
                          </tr>
                        )}

                        {!isLoading &&
                          currentRows.map((item) => (
                            <tr key={item.rowId} className="transition hover:bg-slate-50/70">
                              <td className="px-5 py-4 text-sm font-semibold text-blue-700">{item.codigoVenta}</td>

                              <td className="px-5 py-4">
                                <span className="text-sm font-semibold text-slate-900">{item.cliente}</span>
                              </td>

                              <td className="px-5 py-4">
                                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${paymentMethodClasses(item.metodo)}`}>
                                  <span className="material-symbols-outlined text-[15px]">{methodIcon(item.metodo)}</span>
                                  <span>{item.metodo}</span>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-600">{formatDateDisplay(item.fechaIso)}</td>
                              <td className="px-5 py-4 text-sm font-bold text-slate-900">{`$${formatMoney(item.monto)}`}</td>
                              <td className="min-w-[240px] max-w-[340px] px-5 py-4 text-sm text-slate-500">{item.descripcion}</td>
                              <td className="px-5 py-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openView(item)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                                    title="Ver registro"
                                    aria-label="Ver registro"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  </button>
                                  {sessionRole === 'admin' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => startEditWithAuth(item)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                                        title="Editar registro"
                                        aria-label="Editar registro"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteVenta(item.ventaId)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50"
                                        title="Eliminar registro"
                                        aria-label="Eliminar registro"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}

                        {!isLoading && currentRows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                              No hay transacciones para los filtros seleccionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{`Mostrando ${startIndex} a ${endIndex} de ${filtered.length} resultados`}</span>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <span>Por pagina</span>
                        <select
                          value={pageSize}
                          onChange={(event) => {
                            setPageSize(Number(event.target.value))
                            setCurrentPage(1)
                          }}
                          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {[5, 10, 25, 50, 100].map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    </div>
                  </footer>
                </section>
              </section>
            </section>
          </div>
        </main>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-4">
          <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{`Ver venta #${viewing.codigoVenta}`}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Cliente</p>
                <p className="mt-1 text-sm text-slate-800">{viewing.cliente}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Fecha</p>
                <p className="mt-1 text-sm text-slate-800">{formatDateDisplay(viewing.fecha)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tipo</p>
                <p className="mt-1 text-sm text-slate-800">{viewing.tipo}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Referencia</p>
                <p className="mt-1 text-sm text-slate-800">{viewing.referencia}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Descripcion</p>
                <p className="mt-1 text-sm text-slate-800">{viewing.descripcion || '-'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Valor total</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{`$${formatMoney(viewing.valorTotal)}`}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Formas de pago
              </div>
              <div className="divide-y divide-slate-100">
                {viewing.pagos.map((pago, index) => (
                  <div key={`${pago.medio}-${index}`} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${paymentMethodClasses(pago.medio)}`}>
                      <span className="material-symbols-outlined text-[15px]">{methodIcon(pago.medio)}</span>
                      {pago.medio}
                    </span>
                    <span className="font-medium text-slate-800">{`$${formatMoney(pago.monto)}`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-4">
          <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">Carga de historico desde Excel</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ingresa clave, mes y anio. Solo se procesan hojas con nombre numerico (dia), y se ignoran celdas con #REF!.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-600">
                Mes
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={importMonth}
                  onChange={(event) => setImportMonth(Math.max(1, Math.min(12, Number(event.target.value) || 1)))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Anio
                <input
                  type="number"
                  min={2000}
                  max={9999}
                  value={importYear}
                  onChange={(event) => setImportYear(Math.max(2000, Number(event.target.value) || 2000))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Tipo por defecto para filas sin tipo
              <select
                value={importTipoDefault}
                onChange={(event) => setImportTipoDefault(event.target.value as TipoOption)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
              </select>
            </label>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Archivo Excel
              <input
                type="file"
                accept=".xlsx,.xlsm,.xltx,.xltm"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
            </label>

            {importSummary && <p className="mt-2 text-xs text-emerald-700">{importSummary}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false)
                  setImportSummary(null)
                  setImportFile(null)
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={async () => {
                  if (sessionRole !== 'admin') {
                    setError('Solo el usuario admin puede importar historico.')
                    return
                  }
                  try {
                    const token = await getAdminToken()
                    await handleImportExcel(token)
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : 'No fue posible autenticar modo administrador.')
                  }
                }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isImporting ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </section>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-4">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">{`Editar venta #${editing.id}`}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Empresa
                <select
                  value={editing.empresa}
                  onChange={(event) => setEditing((prev) => (prev ? { ...prev, empresa: event.target.value as EmpresaOption } : prev))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {EMPRESA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Tipo
                <select
                  value={editing.tipo}
                  onChange={(event) => setEditing((prev) => (prev ? { ...prev, tipo: event.target.value as TipoOption } : prev))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Fecha
                <input
                  type="date"
                  value={editing.fecha}
                  onChange={(event) => setEditing((prev) => (prev ? { ...prev, fecha: event.target.value } : prev))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="text-xs font-medium text-slate-600">
                Valor total
                <input
                  type="text"
                  value={editing.valorTotal}
                  onChange={(event) => setEditing((prev) => (prev ? { ...prev, valorTotal: event.target.value } : prev))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Referencia
              <input
                type="text"
                value={editing.referencia}
                onChange={(event) => setEditing((prev) => (prev ? { ...prev, referencia: event.target.value } : prev))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Cliente (opcional)
              <input
                type="text"
                value={editing.clienteQuery}
                onChange={(event) => updateEditClienteQuery(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Busca por nombre o telefono..."
              />
              {isLoadingEditClientes && <p className="mt-1 text-[11px] text-slate-500">Buscando clientes...</p>}
              {!isLoadingEditClientes && editClienteSuggestions.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
                  {editClienteSuggestions.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => selectEditCliente(cliente)}
                      className="flex w-full items-start justify-between border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <span className="text-xs font-medium text-slate-800">{cliente.nombre}</span>
                      <span className="text-[11px] text-slate-500">{cliente.telefono ?? 'Sin telefono'}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {editing.clienteId ? `Cliente seleccionado: #${editing.clienteId}` : 'Sin cliente seleccionado'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing((prev) => (prev ? { ...prev, clienteId: null, clienteQuery: '' } : prev))}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-800"
                >
                  Limpiar
                </button>
              </div>
            </label>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Descripcion
              <textarea
                value={editing.descripcion}
                onChange={(event) => setEditing((prev) => (prev ? { ...prev, descripcion: event.target.value } : prev))}
                className="mt-1 h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="mt-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Formas de pago</p>
                <button
                  type="button"
                  onClick={addEditPayment}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-600"
                >
                  + Agregar pago
                </button>
              </div>

              <div className="space-y-2 p-3">
                {editing.pagos.map((pago) => (
                  <div key={pago.rowId} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_36px]">
                    <select
                      value={pago.medio}
                      onChange={(event) => updateEditPayment(pago.rowId, { medio: event.target.value })}
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Selecciona medio</option>
                      {paymentMethods.map((medio) => (
                        <option key={medio.id} value={medio.codigo}>
                          {medio.nombre}
                        </option>
                      ))}
                      {pago.medio && !paymentMethods.some((medio) => medio.codigo === pago.medio) && (
                        <option value={pago.medio}>{pago.medio}</option>
                      )}
                    </select>
                    <input
                      type="text"
                      value={pago.monto}
                      onChange={(event) => updateEditPayment(pago.rowId, { monto: event.target.value })}
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="0,00"
                    />
                    <button
                      type="button"
                      onClick={() => removeEditPayment(pago.rowId)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50"
                      aria-label="Eliminar forma de pago"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSavingEdit}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </section>
        </div>
      )}

      {!embedded && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-slate-200 bg-white/90 px-2 backdrop-blur lg:hidden">
          <button type="button" onClick={onGoDashboard} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
            <span className="material-symbols-outlined">home</span>
            Dashboard
          </button>
          <button type="button" onClick={onGoRegistro} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
            <span className="material-symbols-outlined">point_of_sale</span>
            Registrar
          </button>
          <button type="button" className="flex flex-col items-center justify-center rounded-xl bg-blue-50 px-3 py-1 text-[11px] text-blue-700">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
            Pagos
          </button>
          <button type="button" onClick={onGoClientes} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
            <span className="material-symbols-outlined">groups</span>
            Clientes
          </button>
          <button type="button" onClick={onGoReportes} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
            <span className="material-symbols-outlined">bar_chart</span>
            Reportes
          </button>
        </nav>
      )}
    </div>
  )
}
