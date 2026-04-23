import type { ChangeEvent } from 'react'

import { EMPRESA_OPTIONS, TIPO_OPTIONS } from '../../constants/ventaOptions'
import type { ClienteResponse, RegistroVentaFormValues } from '../../types/venta'

interface VentaFormFieldsProps {
  values: RegistroVentaFormValues
  clienteSuggestions: ClienteResponse[]
  isLoadingClientes: boolean
  onFieldChange: <K extends keyof RegistroVentaFormValues>(field: K, value: RegistroVentaFormValues[K]) => void
  onClienteQueryChange: (query: string) => void
  onClienteSelect: (cliente: ClienteResponse) => void
}

export function VentaFormFields({
  values,
  clienteSuggestions,
  isLoadingClientes,
  onFieldChange,
  onClienteQueryChange,
  onClienteSelect,
}: VentaFormFieldsProps) {
  const handleChange =
    <K extends keyof RegistroVentaFormValues>(field: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onFieldChange(field, event.target.value as RegistroVentaFormValues[K])
    }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Datos de la venta</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Empresa
          <select
            className="rounded-md border border-slate-300 px-3 py-2"
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
          Tipo
          <select className="rounded-md border border-slate-300 px-3 py-2" value={values.tipo} onChange={handleChange('tipo')} required>
            <option value="">Selecciona tipo</option>
            {TIPO_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Numero referencia
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={values.numeroReferencia}
            onChange={handleChange('numeroReferencia')}
            placeholder="VR-0001"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Valor total
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={values.valorTotal}
            onChange={handleChange('valorTotal')}
            placeholder="0.00"
            inputMode="decimal"
            required
          />
        </label>

        <label className="relative flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          Cliente
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={values.clienteQuery}
            onChange={(event) => onClienteQueryChange(event.target.value)}
            placeholder="Escribe 2+ caracteres"
            autoComplete="off"
          />
          {isLoadingClientes && <span className="mt-1 text-xs text-slate-500">Buscando clientes...</span>}
          {!isLoadingClientes && clienteSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-44 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow">
              {clienteSuggestions.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    type="button"
                    onClick={() => onClienteSelect(cliente)}
                    className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    {cliente.nombre} {cliente.telefono ? `(${cliente.telefono})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Telefono
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={values.telefono}
            onChange={handleChange('telefono')}
            placeholder="3001234567"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          Descripcion
          <textarea
            className="min-h-20 rounded-md border border-slate-300 px-3 py-2"
            value={values.descripcion}
            onChange={handleChange('descripcion')}
            required
          />
        </label>
      </div>
    </section>
  )
}