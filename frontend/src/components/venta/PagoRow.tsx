import type { PagoDraft } from '../../types/venta'

interface PagoRowProps {
  pago: PagoDraft
  mediosOptions: Array<{ value: string; label: string }>
  canRemove: boolean
  onChange: (rowId: string, changes: Partial<Omit<PagoDraft, 'rowId'>>) => void
  onRemove: (rowId: string) => void
}

export function PagoRow({ pago, mediosOptions, canRemove, onChange, onRemove }: PagoRowProps) {
  return (
    <tr className="border-t border-slate-200">
      <td className="px-3 py-2">
        <select
          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
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
          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          value={pago.monto}
          onChange={(event) => onChange(pago.rowId, { monto: event.target.value })}
          inputMode="decimal"
          placeholder="0.00"
          aria-label="Monto del pago"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onRemove(pago.rowId)}
          className="rounded-md border border-rose-300 px-3 py-1 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canRemove}
          aria-label="Eliminar fila de pago"
        >
          Eliminar
        </button>
      </td>
    </tr>
  )
}