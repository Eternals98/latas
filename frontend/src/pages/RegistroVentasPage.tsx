import { useMemo, useState, type FormEvent } from 'react'

import { PagosTable } from '../components/venta/PagosTable'
import { PaymentBalanceIndicator } from '../components/venta/PaymentBalanceIndicator'
import { VentaFormFields } from '../components/venta/VentaFormFields'
import { useRegistroVentaForm } from '../hooks/useRegistroVentaForm'
import { ApiError } from '../services/httpClient'
import { createVenta } from '../services/ventasApi'
import type { CreateVentaRequest } from '../types/venta'
import { parseMoney, toMoneyPayload } from '../utils/money'

function isRequiredText(value: string): boolean {
  return value.trim().length > 0
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
    resetForm,
  } = useRegistroVentaForm()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMedios, setIsLoadingMedios] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const totalAmount = useMemo(() => parseMoney(formValues.valorTotal), [formValues.valorTotal])

  const hasValidPagos = useMemo(
    () => pagos.some((pago) => isRequiredText(pago.medio) && parseMoney(pago.monto) > 0),
    [pagos],
  )

  const canSubmit =
    !isSubmitting &&
    isRequiredText(formValues.numeroReferencia) &&
    isRequiredText(formValues.descripcion) &&
    formValues.empresa !== '' &&
    formValues.tipo !== '' &&
    totalAmount > 0 &&
    hasValidPagos &&
    isBalanced

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || formValues.empresa === '' || formValues.tipo === '') {
      setSubmitMessage({ type: 'error', text: 'Completa campos obligatorios y corrige descuadres antes de guardar.' })
      return
    }

    const payload: CreateVentaRequest = {
      empresa: formValues.empresa,
      tipo: formValues.tipo,
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

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <header className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Registro de Ventas</h1>
        <p className="mt-2 text-sm text-slate-600">Captura una venta completa con pagos multiples en una sola pantalla.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {isLoadingClientes && <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">Cargando clientes...</span>}
          {isLoadingMedios && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Cargando medios de pago...</span>}
          {isSubmitting && <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Enviando venta...</span>}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <VentaFormFields
          values={formValues}
          clienteSuggestions={clienteSuggestions}
          isLoadingClientes={isLoadingClientes}
          onFieldChange={updateField}
          onClienteQueryChange={updateClienteQuery}
          onClienteSelect={selectCliente}
        />

        <PagosTable
          pagos={pagos}
          onAdd={addPagoRow}
          onChange={updatePagoRow}
          onRemove={removePagoRow}
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar venta'}
          </button>
        </div>
      </form>
    </main>
  )
}
