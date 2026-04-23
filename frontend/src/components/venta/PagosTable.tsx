import { useEffect, useMemo, useState } from 'react'

import { listMediosPago } from '../../services/mediosPagoApi'
import type { PagoDraft } from '../../types/venta'
import { PagoRow } from './PagoRow'

interface PagosTableProps {
  pagos: PagoDraft[]
  onAdd: () => void
  onChange: (rowId: string, changes: Partial<Omit<PagoDraft, 'rowId'>>) => void
  onRemove: (rowId: string) => void
  onLoadingChange?: (loading: boolean) => void
}

export function PagosTable({ pagos, onAdd, onChange, onRemove, onLoadingChange }: PagosTableProps) {
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

  const canRemove = useMemo(() => pagos.length > 1, [pagos.length])

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Pagos</h2>
        <button type="button" onClick={onAdd} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Agregar pago
        </button>
      </div>

      {isLoadingMedios && <p className="mb-2 text-sm text-slate-600">Cargando medios de pago...</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-100 text-sm">
              <th className="px-3 py-2 font-semibold">Medio</th>
              <th className="px-3 py-2 font-semibold">Monto</th>
              <th className="px-3 py-2 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <PagoRow key={pago.rowId} pago={pago} mediosOptions={mediosOptions} canRemove={canRemove} onChange={onChange} onRemove={onRemove} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}