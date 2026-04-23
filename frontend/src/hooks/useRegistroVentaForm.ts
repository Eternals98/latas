import { useEffect, useMemo, useRef, useState } from 'react'

import { searchClientes } from '../services/clientesApi'
import type { ClienteResponse, ClienteSummary, FormValidationState, PagoDraft, RegistroVentaFormValues } from '../types/venta'
import { equalsMoney, parseMoney, sumMoney } from '../utils/money'

const SEARCH_THRESHOLD = 2

function createDefaultPago(index: number): PagoDraft {
  return {
    rowId: `pago-${Date.now()}-${index}`,
    medio: '',
    monto: '',
  }
}

export function useRegistroVentaForm() {
  const [formValues, setFormValues] = useState<RegistroVentaFormValues>({
    empresa: '',
    tipo: '',
    numeroReferencia: '',
    descripcion: '',
    valorTotal: '',
    telefono: '',
    clienteQuery: '',
    cliente: null,
  })
  const [pagos, setPagos] = useState<PagoDraft[]>([createDefaultPago(0)])
  const [clienteSuggestions, setClienteSuggestions] = useState<ClienteResponse[]>([])
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)

  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    const query = formValues.clienteQuery.trim()

    if (query.length < SEARCH_THRESHOLD) {
      return
    }

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(async () => {
      setIsLoadingClientes(true)
      try {
        const clientes = await searchClientes(query)
        setClienteSuggestions(clientes)
      } catch {
        setClienteSuggestions([])
      } finally {
        setIsLoadingClientes(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [formValues.clienteQuery])

  const paymentTotal = useMemo(() => sumMoney(pagos.map((pago) => pago.monto)), [pagos])

  const isBalanced = useMemo(() => {
    const total = parseMoney(formValues.valorTotal)
    if (total <= 0) {
      return false
    }
    return equalsMoney(paymentTotal, total)
  }, [formValues.valorTotal, paymentTotal])

  const validationState = useMemo<FormValidationState>(() => {
    if (!formValues.valorTotal.trim() && pagos.every((pago) => !pago.monto.trim())) {
      return 'neutral'
    }
    return isBalanced ? 'ok' : 'error'
  }, [formValues.valorTotal, pagos, isBalanced])

  function updateField<K extends keyof RegistroVentaFormValues>(field: K, value: RegistroVentaFormValues[K]) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  function updateClienteQuery(query: string) {
    if (query.trim().length < SEARCH_THRESHOLD) {
      setClienteSuggestions([])
    }
    setFormValues((prev) => {
      const shouldClearSelection = prev.cliente !== null && query.trim() !== prev.cliente.nombre
      return {
        ...prev,
        clienteQuery: query,
        cliente: shouldClearSelection ? null : prev.cliente,
      }
    })
  }

  function selectCliente(cliente: ClienteSummary) {
    setFormValues((prev) => ({
      ...prev,
      cliente,
      clienteQuery: cliente.nombre,
      telefono: cliente.telefono ?? '',
    }))
    setClienteSuggestions([])
  }

  function addPagoRow() {
    setPagos((prev) => [...prev, createDefaultPago(prev.length)])
  }

  function updatePagoRow(rowId: string, changes: Partial<Omit<PagoDraft, 'rowId'>>) {
    setPagos((prev) => prev.map((pago) => (pago.rowId === rowId ? { ...pago, ...changes } : pago)))
  }

  function removePagoRow(rowId: string) {
    setPagos((prev) => {
      const next = prev.filter((pago) => pago.rowId !== rowId)
      return next.length > 0 ? next : [createDefaultPago(0)]
    })
  }

  function resetForm() {
    setFormValues({
      empresa: '',
      tipo: '',
      numeroReferencia: '',
      descripcion: '',
      valorTotal: '',
      telefono: '',
      clienteQuery: '',
      cliente: null,
    })
    setPagos([createDefaultPago(0)])
    setClienteSuggestions([])
  }

  return {
    formValues,
    pagos,
    clienteSuggestions,
    isLoadingClientes,
    paymentTotal,
    isBalanced,
    validationState,
    updateField,
    updateClienteQuery,
    selectCliente,
    addPagoRow,
    updatePagoRow,
    removePagoRow,
    resetForm,
  }
}
