import type { PagoDraft } from '../../types/venta'
import { maskMoneyInput } from '../../utils/money'

interface PagoRowProps {
  pago: PagoDraft
  mediosOptions: Array<{ value: string; label: string }>
  canRemove: boolean
  disableMontoEdit?: boolean
  onChange: (rowId: string, changes: Partial<Omit<PagoDraft, 'rowId'>>) => void
  onRemove: (rowId: string) => void
}

export function PagoRow({ pago, mediosOptions, canRemove, disableMontoEdit = false, onChange, onRemove }: PagoRowProps) {
  const handleMontoChange = (value: string) => {
    onChange(pago.rowId, { monto: maskMoneyInput(value) })
  }

  return (
    <tr>
      <td className="px-3 py-2">
        <select
          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={pago.medio}
          onChange={(event) => onChange(pago.rowId, { medio: event.target.value })}
          aria-label="Medio de pago"
        >
          <option value="">Selecciona</option>
          {mediosOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={pago.monto}
          onChange={(event) => handleMontoChange(event.target.value)}
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Monto del pago"
          disabled={disableMontoEdit}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onRemove(pago.rowId)}
          className="rounded-md p-1 text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canRemove}
          aria-label="Eliminar fila de pago"
        >
          x
        </button>
      </td>
    </tr>
  )
}
