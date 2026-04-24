import type { ChangeEvent } from 'react'

import { EMPRESA_OPTIONS, TIPO_OPTIONS } from '../../constants/ventaOptions'
import type { ClienteResponse, RegistroVentaFormValues } from '../../types/venta'
import { maskMoneyInput } from '../../utils/money'

interface VentaFormFieldsProps {
  values: RegistroVentaFormValues
  clienteSuggestions: ClienteResponse[]
  isLoadingClientes: boolean
  isCreatingCliente?: boolean
  onFieldChange: <K extends keyof RegistroVentaFormValues>(field: K, value: RegistroVentaFormValues[K]) => void
  onClienteQueryChange: (query: string) => void
  onClienteSelect: (cliente: ClienteResponse) => void
  onCreateClienteFromQuery: () => Promise<void>
}

export function VentaFormFields({
  values,
  clienteSuggestions,
  isLoadingClientes,
  isCreatingCliente = false,
  onFieldChange,
  onClienteQueryChange,
  onClienteSelect,
  onCreateClienteFromQuery,
}: VentaFormFieldsProps) {
  const handleChange =
    <K extends keyof RegistroVentaFormValues>(field: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onFieldChange(field, event.target.value as RegistroVentaFormValues[K])
    }

  const handleMoneyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange('valorTotal', maskMoneyInput(event.target.value))
  }
  const hasQuery = values.clienteQuery.trim().length > 0
  const isSelectedCliente =
    values.cliente !== null && values.cliente.nombre.trim().toLowerCase() === values.clienteQuery.trim().toLowerCase()
  const showClienteDropdown = hasQuery && !isSelectedCliente

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Empresa
          <select
            className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.empresa}
            onChange={handleChange('empresa')}
            required
          >
            <option value="">Selecciona empresa</option>
            {EMPRESA_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Fecha de venta
          <input
            type="date"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.fechaVenta}
            onChange={handleChange('fechaVenta')}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Tipo
          <select
            className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.tipo}
            onChange={handleChange('tipo')}
            required
          >
            <option value="">Selecciona tipo</option>
            {TIPO_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Número de referencia
          <input
            className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.numeroReferencia}
            onChange={handleChange('numeroReferencia')}
            placeholder="REF-00123"
            required
          />
        </label>

        <label className="relative flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          Cliente
          <input
            className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.clienteQuery}
            onChange={(event) => onClienteQueryChange(event.target.value)}
            placeholder="Escribe para buscar cliente"
            autoComplete="off"
          />
          {isLoadingClientes && <span className="mt-1 text-xs text-slate-500">Buscando clientes...</span>}
          {!isLoadingClientes && showClienteDropdown && (
            <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-44 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow">
              {clienteSuggestions.length > 0 ? (
                clienteSuggestions.map((cliente) => (
                  <li key={cliente.id}>
                    <button
                      type="button"
                      onClick={() => onClienteSelect(cliente)}
                      className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      {cliente.nombre} {cliente.telefono ? `(${cliente.telefono})` : ''}
                    </button>
                  </li>
                ))
              ) : (
                <li>
                  <button
                    type="button"
                    onClick={() => void onCreateClienteFromQuery()}
                    disabled={isCreatingCliente}
                    className="w-full rounded px-2 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {isCreatingCliente ? 'Creando cliente...' : `Crear cliente "${values.clienteQuery.trim()}"`}
                  </button>
                </li>
              )}
            </ul>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Teléfono
          <input
            className="h-11 rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.telefono}
            onChange={handleChange('telefono')}
            placeholder="3001234567"
            inputMode="numeric"
            maxLength={10}
            pattern="\d{10}"
          />
          {values.telefono.length > 0 && values.telefono.length < 10 && (
            <span className="text-xs text-rose-600">Debe tener exactamente 10 dígitos.</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Valor total
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2.5 text-slate-500">$</span>
            <input
              className="h-11 w-full rounded-md border border-slate-300 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={values.valorTotal}
              onChange={handleMoneyChange}
              placeholder="0,00"
              inputMode="decimal"
              required
            />
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          Descripción
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={values.descripcion}
            onChange={handleChange('descripcion')}
            placeholder="Detalles adicionales de la venta..."
            required
          />
        </label>
      </div>
    </section>
  )
}
