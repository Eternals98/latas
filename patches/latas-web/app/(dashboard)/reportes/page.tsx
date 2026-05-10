'use client';

import { useState } from 'react';
import { Card, Button, Icon, cn } from '@/components/Primitives';

type ReportType = 'detail' | 'consol' | 'method' | 'cash';

const REPORT_TYPES: Array<{ id: ReportType; label: string; desc: string; icon: string }> = [
  { id: 'consol',  label: 'Consolidado diario',  desc: 'Totales por día y por empresa.',   icon: 'receipt'    },
  { id: 'detail',  label: 'Detallado diario',     desc: 'Transacciones línea por línea.',    icon: 'list'       },
  { id: 'method',  label: 'Pagos por método',     desc: 'Efectivo, tarjeta, transferencia.', icon: 'creditCard' },
  { id: 'cash',    label: 'Cierre de caja',        desc: 'Aperturas, retiros y diferencias.', icon: 'dollarSign' },
];

const TODAY       = new Date().toISOString().slice(0, 10);
const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().slice(0, 10);

export default function ReportesPage() {
  const [type,     setType]     = useState<ReportType>('consol');
  const [dateFrom, setDateFrom] = useState(MONTH_START);
  const [dateTo,   setDateTo]   = useState(TODAY);
  const [loading,  setLoading]  = useState(false);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, date_from: dateFrom, date_to: dateTo, format });
      window.open(`/api/bff/ventas/export?${params}`, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-paper-100">
      <div className="max-w-[1200px] mx-auto space-y-6">

        <div>
          <h1 className="mb-2 text-4xl font-bold font-display text-ink-900">Reportes Operativos</h1>
          <p className="text-slate-600">Genere y exporte resúmenes auditables del período seleccionado.</p>
        </div>

        {/* Tipo de reporte */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {REPORT_TYPES.map((r) => {
            const active = r.id === type;
            return (
              <button
                key={r.id}
                onClick={() => setType(r.id)}
                className={cn(
                  'text-left p-5 rounded-xl border transition-all',
                  active
                    ? 'bg-ink-900 border-ink-900 text-paper-50'
                    : 'bg-white border-slate-200 text-ink-900 hover:border-brass-400',
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg grid place-items-center mb-4',
                  active ? 'bg-brass-400 text-ink-900' : 'bg-paper-200 text-slate-600',
                )}>
                  <Icon name={r.icon as any} size={20} />
                </div>
                <div className="font-bold text-[15px]">{r.label}</div>
                <div className={cn('text-xs mt-1', active ? 'text-paper-200' : 'text-slate-500')}>
                  {r.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Parámetros */}
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">
            Parámetros
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
            <div>
              <label className="block mb-2 text-xs font-semibold text-ink-900">Desde</label>
              <input
                type="date" value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-slate-200 bg-white font-mono text-sm outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25"
              />
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold text-ink-900">Hasta</label>
              <input
                type="date" value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-slate-200 bg-white font-mono text-sm outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25"
              />
            </div>
            <div className="md:col-span-2 flex gap-3 items-end">
              <Button variant="ghost" size="md" onClick={() => handleExport('pdf')} disabled={loading}>
                <Icon name="printer" size={16} /> Exportar PDF
              </Button>
              <Button variant="accent" size="md" onClick={() => handleExport('xlsx')} disabled={loading}>
                <Icon name="download" size={16} /> Exportar Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Preview placeholder */}
        <Card padding={0}>
          <div className="px-6 py-4 border-b border-slate-200 bg-paper-50">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Vista previa
            </div>
            <div className="mt-1 font-bold text-ink-900">
              {REPORT_TYPES.find((r) => r.id === type)?.label} · {dateFrom} → {dateTo}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Icon name="clipboard" size={48} className="mb-4 opacity-30" />
            <p className="font-semibold">Aplique filtros y genere el reporte</p>
            <p className="text-sm mt-1 opacity-70">Los datos aparecerán aquí antes de exportar</p>
          </div>
        </Card>

      </div>
    </div>
  );
}
