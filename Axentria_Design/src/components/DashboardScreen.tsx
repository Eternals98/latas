'use client';

import React, { useState } from 'react';
import { Card, Badge, Avatar, Button, Icon, cn } from './Primitives';

export const DashboardScreen = ({ go }: { go: (id: string) => void }) => {
  const [val1] = useState(124500);
  const [val2] = useState(118200);
  const [val3] = useState(290000);
  const dailySeries = [42,46,49,44,52,58,55,63,67,72,69,78,82,88,95,90,97,102,108,118];

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-5">
        <HeroFigure accent label="Ventas totales · Mes" value={val1} delta="+12.4% vs mes anterior" note="Cierre proyectado $138 k"/>
        <HeroFigure label="Ventas del día" value={val2} delta="+8.1%" note="hoy · 14:32"/>
        <HeroFigure label="Efectivo total en caja" value={val3} delta="−$3.200 retiros" deltaTone="coral" note="3 cajas activas"/>
      </div>

      <Card className="mt-5 p-6 md:p-7 grid grid-cols-[1fr_240px_240px] gap-8 items-center hover:shadow-elev-2 transition-shadow">
        <div>
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Tendencia · últimos 20 días</div>
          <div className="font-display text-[48px] leading-[1.1] mt-2 text-ink-900">
            $ <span className="font-mono font-medium tabular-nums">124.500</span>
          </div>
          <div className="text-sm text-slate-500 mt-1.5">
            Promedio diario <span className="font-mono text-ink-900 font-bold">$ 6.225</span> · pico registrado el lunes 6 may
          </div>
        </div>
        <Spark data={dailySeries} color="var(--brass-500)" width={240} height={80}/>
        <div className="flex flex-col gap-2.5 text-sm pl-5 border-l border-slate-200">
          <div className="flex justify-between"><span>Ticket promedio</span><span className="font-mono font-bold">$ 18.420</span></div>
          <div className="flex justify-between"><span>Ventas registradas</span><span className="font-mono font-bold">2.295</span></div>
          <div className="flex justify-between"><span>Devoluciones</span><span className="font-mono font-bold text-coral-600">3 · $ 850</span></div>
          <div className="flex justify-between items-center"><span>Estado caja</span><Badge tone="success">abierta</Badge></div>
        </div>
      </Card>

      <div className="grid grid-cols-[1.6fr_1fr] gap-5 mt-5">
        <Card padding={0} className="overflow-hidden">
          <div className="px-5.5 py-4.5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Ventas por entidad</div>
              <div className="text-lg font-bold text-ink-900">Distribución operativa</div>
            </div>
            <Button variant="text" size="sm">Ver todas →</Button>
          </div>
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="bg-paper-200 border-b border-slate-200">
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Entidad</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Tipo</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500 text-right">Volumen</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500 text-right">Ingresos</th>
                <th className="p-3.5 px-4 text-[11px] tracking-widest uppercase font-semibold text-slate-500">Participación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-paper-50 transition-colors">
                <td className="p-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name="Latas SAS" size={30} tone="ink"/>
                    <span className="font-semibold">Latas S.A.S.</span>
                  </div>
                </td>
                <td className="p-3.5 px-4"><Badge tone="info">Empresa</Badge></td>
                <td className="p-3.5 px-4 text-right font-mono tabular-nums">1.245</td>
                <td className="p-3.5 px-4 text-right font-mono font-bold tabular-nums">$ 65.400</td>
                <td className="p-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-paper-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brass-400" style={{ width: '53%' }} />
                    </div>
                    <span className="font-mono text-[11px]">53%</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-paper-50 transition-colors">
                <td className="p-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name="Tomas Gomez" size={30} tone="brass"/>
                    <span className="font-semibold">Tomás Gómez</span>
                  </div>
                </td>
                <td className="p-3.5 px-4"><Badge tone="warn">Cliente</Badge></td>
                <td className="p-3.5 px-4 text-right font-mono tabular-nums">892</td>
                <td className="p-3.5 px-4 text-right font-mono font-bold tabular-nums">$ 42.100</td>
                <td className="p-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-paper-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brass-400" style={{ width: '34%' }} />
                    </div>
                    <span className="font-mono text-[11px]">34%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
        
        <div className="flex flex-col gap-5">
          <Card>
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Acciones rápidas</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <QuickAction icon="plus" label="Nueva venta" onClick={()=>go('sale')}/>
              <QuickAction icon="cash" label="Gestión caja" accent onClick={()=>go('cash')}/>
              <QuickAction icon="receipt" label="Historial" onClick={()=>go('transactions')}/>
              <QuickAction icon="list" label="Reportes" onClick={()=>go('reports')}/>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const HeroFigure = ({ label, value, delta, deltaTone = "sage", note, accent = false }: { label: string, value: number, delta?: string, deltaTone?: string, note?: string, accent?: boolean }) => (
  <div className={cn(
    "flex flex-col gap-2.5 min-h-[150px] p-5.5 rounded-xl border transition-all hover:shadow-elev-2",
    accent ? "bg-ink-900 text-paper-50 border-ink-900" : "bg-white text-ink-900 border-slate-200 border-l-[3px] border-l-brass-400"
  )}>
    <div className={cn("text-[11px] tracking-overline uppercase font-semibold", accent ? "text-brass-300" : "text-slate-500")}>
      {label}
    </div>
    <div className="font-display text-[52px] leading-none">
      <span className="font-mono">$</span>
      <span className="font-mono font-medium tabular-nums">{value.toLocaleString("es-CL")}</span>
    </div>
    <div className="flex items-center gap-2.5 text-xs">
      {delta && (
        <span className={cn(
          "px-2.5 py-1 rounded-full font-semibold",
          accent ? "bg-white/10" : (deltaTone === "sage" ? "bg-sage-50 text-sage-700" : "bg-coral-50 text-coral-700")
        )}>
          {delta}
        </span>
      )}
      {note && <span className="opacity-70">{note}</span>}
    </div>
  </div>
);

const Spark = ({ data, color, width, height }: { data: number[], color: string, width: number, height: number }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const dx = width / (data.length - 1);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * dx).toFixed(1)},${(height - ((v - min) / (max - min || 1)) * (height - 10) - 5).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height}>
      <path d={path + ` L${width},${height} L0,${height} Z`} fill={color} fillOpacity="0.1"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
};

const QuickAction = ({ icon, label, onClick, accent }: { icon: string, label: string, onClick: () => void, accent?: boolean }) => (
  <button 
    onClick={onClick} 
    className={cn(
      "flex items-center gap-2.5 p-3.5 rounded-lg border font-sans font-semibold text-sm transition-all hover:shadow-elev-2 w-full text-ink-900",
      accent ? "bg-brass-50 border-brass-200" : "bg-white border-slate-200"
    )}
  >
    <span className={cn(
      "w-7.5 h-7.5 rounded-lg flex items-center justify-center",
      accent ? "bg-brass-400" : "bg-paper-200"
    )}>
      <Icon name={icon} size={15}/>
    </span>
    {label}
  </button>
);
