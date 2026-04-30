import { useEffect, useMemo, useState } from 'react'

import { listMediosPago } from '../../services/mediosPagoApi'
import type { PagoDraft } from '../../types/venta'
import { PagoRow } from './PagoRow'

interface PagosTableProps {
  pagos: PagoDraft[]
  onAdd: () => void
  onChange: (rowId: string, changes: Partial<Omit<PagoDraft, 'rowId'>>) => void
  onRemove: (rowId: string) => void
  isSinglePaymentMode?: boolean
  onToggleSinglePaymentMode?: () => void
  disableAdd?: boolean
  disableMontoEdit?: boolean
  forceSingleRow?: boolean
  onLoadingChange?: (loading: boolean) => void
}

export function PagosTable({
  pagos,
  onAdd,
  onChange,
  onRemove,
  isSinglePaymentMode = false,
  onToggleSinglePaymentMode,
  disableAdd = false,
  disableMontoEdit = false,
  forceSingleRow = false,
  onLoadingChange,
}: PagosTableProps) {
  const [mediosOptions, setMediosOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingMedios, setIsLoadingMedios] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      setIsLoadingMedios(true)
      onLoadingChange?.(true)
      try {
        const medios = await listMediosPago()
        if (!mounted) {
          return
        }
        setMediosOptions(medios.filter((medio) => medio.activo).map((medio) => ({ value: medio.codigo, label: medio.nombre })))
      } finally {
        if (mounted) {
          setIsLoadingMedios(false)
          onLoadingChange?.(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [onLoadingChange])

  const canRemove = useMemo(() => !forceSingleRow && pagos.length > 1, [forceSingleRow, pagos.length])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Pagos</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSinglePaymentMode}
            className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${
              isSinglePaymentMode ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Forma de pago única
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={disableAdd}
            className="rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            + Agregar pago
          </button>
        </div>
      </div>

      {isLoadingMedios && <p className="mb-2 text-sm text-slate-600">Cargando medios de pago...</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3 font-semibold">Método</th>
              <th className="px-3 py-3 font-semibold">Monto</th>
              <th className="w-10 px-3 py-3 text-right font-semibold"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pagos.map((pago) => (
              <PagoRow
                key={pago.rowId}
                pago={pago}
                mediosOptions={mediosOptions}
                canRemove={canRemove}
                disableMontoEdit={disableMontoEdit}
                onChange={onChange}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
