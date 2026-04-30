import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { PagosTable } from '../components/venta/PagosTable'
import { PaymentBalanceIndicator } from '../components/venta/PaymentBalanceIndicator'
import { VentaFormFields } from '../components/venta/VentaFormFields'
import { useRegistroVentaForm } from '../hooks/useRegistroVentaForm'
import { createCliente, updateCliente } from '../services/clientesApi'
import { ApiError } from '../services/httpClient'
import { createVenta } from '../services/ventasApi'
import type { CreateVentaRequest } from '../types/venta'
import { parseMoney, toMoneyPayload } from '../utils/money'

function isRequiredText(value: string): boolean {
  return value.trim().length > 0
}

function normalizePhone(value: string | null | undefined): string {
  return `${value ?? ''}`.replace(/\D/g, '')
}

export function RegistroVentasPage() {
  const {
    formValues,
    pagos,
    clienteSuggestions,
    isLoadingClientes,
    paymentTotal,
    isBalanced,
    updateField,
    updateClienteQuery,
    selectCliente,
    addPagoRow,
    updatePagoRow,
    removePagoRow,
    setPagosDrafts,
    resetForm,
  } = useRegistroVentaForm()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMedios, setIsLoadingMedios] = useState(false)
  const [isCreatingCliente, setIsCreatingCliente] = useState(false)
  const [isSinglePaymentMode, setIsSinglePaymentMode] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const totalAmount = useMemo(() => parseMoney(formValues.valorTotal), [formValues.valorTotal])

  const hasValidPagos = useMemo(
    () => pagos.some((pago) => isRequiredText(pago.medio) && parseMoney(pago.monto) > 0),
    [pagos],
  )
  const isTelefonoValid = formValues.telefono.length === 0 || formValues.telefono.length === 10

  const canSubmit =
    !isSubmitting &&
    isRequiredText(formValues.numeroReferencia) &&
    isRequiredText(formValues.descripcion) &&
    formValues.empresa !== '' &&
    formValues.tipo !== '' &&
    totalAmount > 0 &&
    hasValidPagos &&
    isTelefonoValid &&
    isBalanced

  useEffect(() => {
    if (!isSinglePaymentMode || pagos.length <= 1) {
      return
    }
    setPagosDrafts([pagos[0]])
  }, [isSinglePaymentMode, pagos, setPagosDrafts])

  useEffect(() => {
    if (!isSinglePaymentMode || pagos.length === 0) {
      return
    }
    const firstPago = pagos[0]
    if (!isRequiredText(firstPago.medio)) {
      return
    }
    if (firstPago.monto === formValues.valorTotal) {
      return
    }
    updatePagoRow(firstPago.rowId, { monto: formValues.valorTotal })
  }, [isSinglePaymentMode, pagos, formValues.valorTotal, updatePagoRow])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || formValues.empresa === '' || formValues.tipo === '') {
      setSubmitMessage({ type: 'error', text: 'Completa campos obligatorios, teléfono válido y corrige descuadres antes de guardar.' })
      return
    }

    const payload: CreateVentaRequest = {
      empresa: formValues.empresa,
      tipo: formValues.tipo,
      fecha_venta: formValues.fechaVenta,
      numero_referencia: formValues.numeroReferencia.trim(),
      descripcion: formValues.descripcion.trim(),
      valor_total: toMoneyPayload(totalAmount),
      cliente_id: formValues.cliente?.id ?? null,
      pagos: pagos
        .filter((pago) => isRequiredText(pago.medio) && parseMoney(pago.monto) > 0)
        .map((pago) => ({
          medio: pago.medio.trim(),
          monto: toMoneyPayload(pago.monto),
        })),
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      if (formValues.cliente && formValues.telefono.length === 10) {
        const selectedPhone = normalizePhone(formValues.cliente.telefono)
        const currentPhone = normalizePhone(formValues.telefono)
        if (currentPhone !== selectedPhone) {
          const updatedCliente = await updateCliente(formValues.cliente.id, {
            nombre: formValues.cliente.nombre,
            telefono: currentPhone,
          })
          selectCliente(updatedCliente)
        }
      }

      await createVenta(payload)
      setSubmitMessage({ type: 'success', text: 'Venta registrada correctamente.' })
      resetForm()
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitMessage({ type: 'error', text: error.message })
      } else {
        setSubmitMessage({ type: 'error', text: 'No fue posible registrar la venta. Intenta de nuevo.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePagoChange(rowId: string, changes: Partial<{ medio: string; monto: string }>) {
    if (!isSinglePaymentMode) {
      updatePagoRow(rowId, changes)
      return
    }

    const firstPago = pagos[0]
    if (!firstPago || rowId !== firstPago.rowId) {
      return
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'medio')) {
      const medio = `${changes.medio ?? ''}`
      updatePagoRow(rowId, {
        medio,
        monto: isRequiredText(medio) ? formValues.valorTotal : '',
      })
      return
    }
  }

  async function handleCreateClienteFromQuery() {
    const nombre = formValues.clienteQuery.trim()
    if (!nombre) {
      return
    }

    setIsCreatingCliente(true)
    setSubmitMessage(null)

    try {
      const created = await createCliente({
        nombre,
        telefono: formValues.telefono.length === 10 ? formValues.telefono : null,
      })
      selectCliente(created)
      setSubmitMessage({ type: 'success', text: 'Cliente creado y seleccionado correctamente.' })
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitMessage({ type: 'error', text: error.message })
      } else {
        setSubmitMessage({ type: 'error', text: 'No fue posible crear el cliente.' })
      }
    } finally {
      setIsCreatingCliente(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-7 md:px-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Registro de Ventas</h1>
        <p className="mt-1 text-sm text-slate-600">Complete los detalles para registrar una nueva transaccion.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {isLoadingClientes && <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">Cargando clientes...</span>}
          {isLoadingMedios && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Cargando medios de pago...</span>}
          {isSubmitting && <span className="rounded bg-slate-200 px-2 py-1 text-slate-700">Enviando venta...</span>}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <VentaFormFields
          values={formValues}
          clienteSuggestions={clienteSuggestions}
          isLoadingClientes={isLoadingClientes}
          isCreatingCliente={isCreatingCliente}
          onFieldChange={updateField}
          onClienteQueryChange={updateClienteQuery}
          onClienteSelect={selectCliente}
          onCreateClienteFromQuery={handleCreateClienteFromQuery}
        />

        <PagosTable
          pagos={pagos}
          onAdd={addPagoRow}
          onChange={handlePagoChange}
          onRemove={removePagoRow}
          isSinglePaymentMode={isSinglePaymentMode}
          onToggleSinglePaymentMode={() => setIsSinglePaymentMode((prev) => !prev)}
          disableAdd={isSinglePaymentMode}
          disableMontoEdit={isSinglePaymentMode}
          forceSingleRow={isSinglePaymentMode}
          onLoadingChange={setIsLoadingMedios}
        />

        <PaymentBalanceIndicator total={totalAmount} paymentTotal={paymentTotal} isBalanced={isBalanced} />

        {submitMessage && (
          <div
            className={`rounded-md px-4 py-3 text-sm ${
              submitMessage.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar venta'}
          </button>
        </div>
      </form>
    </main>
  )
}
