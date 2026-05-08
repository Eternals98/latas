'use client';

import React from 'react';
import { Card, Button, Icon, Badge, BrandLogo, cn } from './Primitives';

export const ReportsScreen = () => {
  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Reportes Disponibles</div>
          <div className="flex flex-col gap-3">
            <ReportItem 
              title="Resumen de Ventas Diarias" 
              desc="Detalle de transacciones, medios de pago y arqueo de caja."
              icon="chart"
            />
            <ReportItem 
              title="Libro de Ingresos" 
              desc="Registro cronológico de todos los ingresos operativos."
              icon="receipt"
              active
            />
            <ReportItem 
              title="Reporte de Entidades" 
              desc="Análisis de volumen de ventas por cliente y sucursal."
              icon="users"
            />
            <ReportItem 
              title="Auditoría de Movimientos" 
              desc="Log completo de acciones de usuarios y ajustes de caja."
              icon="settings"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Vista Previa</div>
          <Card padding={0} className="bg-white min-h-[500px] shadow-elev-3 relative overflow-hidden border-slate-200">
            {/* Ledger paper effect */}
            <div className="absolute left-10 top-0 bottom-0 w-px bg-red-500/10 pointer-events-none" />
            
            <div className="p-10 md:p-15">
              <div className="text-center mb-10">
                <BrandLogo height={24} color="var(--ink-900)" className="mb-2 opacity-50 mx-auto" />
                <div className="text-[10px] tracking-widest uppercase text-slate-400 font-bold">Reporte de Auditoría</div>
              </div>

              <div className="flex justify-between border-b-2 border-ink-900 pb-3 mb-6">
                <h3 className="font-display text-2xl m-0 text-ink-900">Libro de Ingresos</h3>
                <div className="font-mono text-xs font-bold tabular-nums">8 MAY 2026</div>
              </div>

              <div className="flex flex-col gap-4">
                <PlaceholderRow date="08/05" desc="Venta INV-9942A - Latas S.A.S." amount="$ 12.450" />
                <PlaceholderRow date="08/05" desc="Venta INV-9941A - Tomás Gómez" amount="$ 8.920" />
                <PlaceholderRow date="08/05" desc="Ajuste de Caja - Saldo Inicial" amount="$ 150.000" />
                <PlaceholderRow date="07/05" desc="Venta INV-9938A - Constructora Sol" amount="$ 128.000" />
              </div>

              <div className="mt-15 flex justify-end">
                <div className="text-right border-t border-ink-900 pt-3 w-[200px]">
                  <div className="text-[9px] tracking-overline uppercase font-bold text-slate-500">Total General</div>
                  <div className="font-mono text-xl font-extrabold text-ink-900 tabular-nums">$ 299.370</div>
                </div>
              </div>

              <div className="mt-20 opacity-20 -rotate-6 absolute bottom-15 right-15 pointer-events-none select-none">
                <div className="border-[3px] border-ink-900 p-2.5 px-5 rounded-lg font-black text-sm uppercase tracking-widest">
                  Auditoría Aprobada
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="primary" icon="download" className="flex-1">Descargar PDF</Button>
            <Button variant="ghost" icon="print">Imprimir</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportItem = ({ title, desc, icon, active }: { title: string, desc: string, icon: string, active?: boolean }) => (
  <div className={cn(
    "flex gap-4 p-5 rounded-xl border transition-all cursor-pointer hover:shadow-elev-1",
    active ? "bg-paper-50 border-brass-400" : "bg-white border-slate-200"
  )}>
    <div className={cn(
      "w-11 h-11 rounded-lg grid place-items-center transition-colors",
      active ? "bg-brass-400 text-ink-900" : "bg-paper-200 text-slate-500"
    )}>
      <Icon name={icon} size={20} />
    </div>
    <div className="flex-1">
      <div className="text-[15px] font-bold text-ink-900">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{desc}</div>
    </div>
    {active && <Badge tone="info" dot={false} className="self-start">Seleccionado</Badge>}
  </div>
);

const PlaceholderRow = ({ date, desc, amount }: { date: string, desc: string, amount: string }) => (
  <div className="grid grid-cols-[60px_1fr_100px] text-xs text-ink-900 border-b border-dashed border-slate-200 pb-2">
    <span className="font-mono font-bold tabular-nums">{date}</span>
    <span className="font-sans font-medium">{desc}</span>
    <span className="font-mono text-right font-bold tabular-nums">{amount}</span>
  </div>
);
