'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, Icon, cn } from './Primitives';

export const SaleScreen = ({ cashOpen, openCash }: { cashOpen: boolean, openCash: () => void }) => {
  const [entity,  setEntity]  = useState("Acme Corporation Ltd.");
  const [entityId,setEntityId]= useState("9842-A");
  const [branch,  setBranch]  = useState("Sede Centro");
  const [date,    setDate]    = useState("2026-05-08");
  const [ref,     setRef]     = useState("INV-2026-9942A");
  const [notes,   setNotes]   = useState("");
  const [total,   setTotal]   = useState(12450);
  const [rows,    setRows]    = useState([
    { method: "Transferencia Bancaria", amount: 12000 },
  ]);

  const paid = useMemo(() => rows.reduce((a, r) => a + (Number(r.amount) || 0), 0), [rows]);
  const diff = total - paid;

  const addRow = () => setRows([...rows, { method: "Efectivo", amount: 0 }]);
  const updateRow = (i: number, k: string, v: any) => setRows(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const cashLocked = !cashOpen && rows.some(r => r.method === "Efectivo" && r.amount > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-8 pb-[100px] max-w-[1400px] mx-auto">
      {/* LEFT — form */}
      <Card padding={0} className="relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brass-400" />
        
        <div className="p-8">
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Asiento de venta · Operación #4821</div>
          <h2 className="font-display text-[44px] leading-tight mt-3 text-ink-900">
            Nueva venta <span className="text-slate-300 font-light">/</span> <span className="font-mono font-normal text-brass-600">INV-9942A</span>
          </h2>

          {/* Two-column form */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Entidad del cliente</label>
              <div className="relative">
                <span className="absolute top-3 left-3.5 text-slate-400"><Icon name="users" size={16}/></span>
                <input 
                  className="w-full px-3.5 py-2.5 pl-11 pr-24 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans" 
                  value={entity} 
                  onChange={e => setEntity(e.target.value)}
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-paper-200 rounded-sm text-[11px] text-slate-600 font-bold font-mono">ID {entityId}</span>
              </div>
              <div className="text-xs text-slate-500">Empresa o cliente final registrado en el catálogo</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Monto total a facturar</label>
              <div className="relative">
                <span className="absolute top-2.5 left-3.5 text-slate-400 font-mono text-lg leading-none mt-0.5">$</span>
                <input 
                  className="w-full px-3.5 py-2.5 pl-7.5 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[18px] font-mono font-bold text-ink-900 tabular-nums" 
                  type="number"
                  value={total} 
                  onChange={e => setTotal(Number(e.target.value) || 0)}
                />
              </div>
              <div className="text-xs text-slate-500">Valor total incluyendo impuestos aplicables</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Sucursal operativa</label>
              <div className="relative">
                <select 
                  className="w-full px-3.5 py-2.5 pr-10 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans appearance-none" 
                  value={branch} 
                  onChange={e => setBranch(e.target.value)}
                >
                  <option>Sede Centro</option>
                  <option>Sucursal Norte</option>
                  <option>Bodega Principal</option>
                </select>
                <span className="absolute top-3 right-3.5 text-slate-400 pointer-events-none">
                  <Icon name="chevronDown" size={16}/>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Fecha del movimiento</label>
              <div className="relative">
                <span className="absolute top-3 left-3.5 text-slate-400"><Icon name="calendar" size={16}/></span>
                <input 
                  className="w-full px-3.5 py-2.5 pl-11 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-mono tabular-nums" 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Notas de la transacción</label>
              <textarea 
                className="w-full px-3.5 py-3 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans resize-none" 
                rows={2} 
                placeholder="Describa brevemente el motivo o detalles de la venta…"
                value={notes} 
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Cash warning */}
          {cashLocked && (
            <div className="flex items-center gap-4 bg-coral-50 border border-coral-500/20 text-coral-700 p-4 px-5 rounded-xl mt-7 animate-in fade-in slide-in-from-top-2">
              <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 flex-shrink-0">
                <Icon name="x" size={20}/>
              </div>
              <div className="flex-1">
                <div className="font-bold text-[15px]">Caja cerrada</div>
                <div className="text-sm mt-0.5 opacity-90">No se pueden registrar pagos en efectivo sin una apertura de caja activa.</div>
              </div>
              <Button variant="danger" size="sm" onClick={openCash} icon="cash">Abrir caja ahora</Button>
            </div>
          )}

          {/* Allocation table */}
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center px-5 py-4 bg-paper-50 border-b border-slate-200">
              <div className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Desglose de medios de pago</div>
              <Button variant="text" size="sm" onClick={addRow} icon="plus" className="ml-auto text-brass-600">Añadir método</Button>
            </div>
            
            <div className="grid grid-cols-[1.4fr_1fr_48px] gap-4 px-5 py-3 bg-paper-200 text-slate-500 text-[11px] font-bold tracking-widest uppercase">
              <span>Medio de pago</span><span className="text-right">Importe</span><span/>
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1.4fr_1fr_48px] gap-4 px-5 py-3.5 items-center">
                  <div className="relative">
                    <select 
                      className="w-full px-3 py-2.5 pr-9 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-sm font-semibold appearance-none" 
                      value={r.method} 
                      onChange={e => updateRow(i, "method", e.target.value)}
                    >
                      <option>Efectivo</option>
                      <option>Tarjeta de Crédito</option>
                      <option>Tarjeta de Débito</option>
                      <option>Transferencia Bancaria</option>
                      <option>Crédito Directo</option>
                    </select>
                    <span className="absolute top-2.5 right-3 text-slate-400 pointer-events-none">
                      <Icon name="chevronDown" size={14}/>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute top-2.5 left-3.5 text-slate-400 font-mono leading-none mt-0.5">$</span>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2.5 pl-7 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-right font-mono font-bold text-base tabular-nums"
                      value={r.amount} 
                      onChange={e => updateRow(i, "amount", Number(e.target.value) || 0)}
                    />
                  </div>
                  <button 
                    onClick={() => removeRow(i)} 
                    className="w-9 h-9 rounded-lg bg-paper-100 border border-slate-200 text-slate-500 hover:text-coral-600 hover:border-coral-200 hover:bg-coral-50 flex items-center justify-center transition-all"
                  >
                    <Icon name="trash" size={14}/>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-5 py-4 bg-paper-50 border-t border-slate-200">
              <span className="text-[12px] tracking-overline uppercase font-semibold text-slate-500">Total asignado</span>
              <span className="font-mono text-ink-900 font-extrabold text-lg tabular-nums">$ {paid.toLocaleString("es-CL")}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* RIGHT — summary */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 self-start">
        <SummaryCard label="Total de la venta" value={total} variant="inverse"/>
        <SummaryCard label="Monto cubierto" value={paid} variant="default"/>
        <SummaryCard 
          label={diff === 0 ? "Balance exacto" : diff > 0 ? "Saldo pendiente" : "Vuelto / Excedente"} 
          value={diff} 
          tone={diff === 0 ? "success" : diff > 0 ? "danger" : "success"}
        />

        <div className="mt-2 flex flex-col gap-3">
          <Button 
            variant="accent" 
            size="lg" 
            disabled={cashLocked || diff > 0} 
            className="h-14 text-base shadow-elev-2" 
            onClick={() => {}} 
            icon="check"
          >
            Registrar transacción
          </Button>
          <Button variant="ghost" size="lg" className="h-13">
            Cancelar y limpiar
          </Button>
        </div>

        <Card className="bg-paper-50 p-5">
          <div className="text-[10px] tracking-overline uppercase font-semibold text-slate-500 mb-3">Atajos de teclado</div>
          <div className="flex flex-col gap-2">
            <Shortcut k="F2" label="Nueva venta"/>
            <Shortcut k="Ctrl + S" label="Guardar asiento"/>
            <Shortcut k="Esc" label="Limpiar formulario"/>
          </div>
        </Card>
      </aside>
    </div>
  );
};

const SummaryCard = ({ label, value, variant = "default", tone }: { label: string, value: number, variant?: 'default' | 'inverse', tone?: 'success' | 'danger' | 'neutral' }) => {
  const isNeg = value < 0;
  const fgClasses = {
    danger: "text-coral-600",
    success: "text-sage-600",
    neutral: variant === 'inverse' ? "text-paper-50" : "text-ink-900",
  };
  const toneColor = tone === 'danger' ? 'var(--coral-500)' : tone === 'success' ? 'var(--sage-500)' : 'var(--brass-400)';
  
  return (
    <Card 
      variant={variant}
      className={cn(
        "p-5 px-6 transition-all hover:shadow-elev-2",
        variant !== 'inverse' && "border-l-4"
      )} 
      style={variant !== 'inverse' ? { borderLeftColor: toneColor } : {}}
    >
      <div className={cn("text-[11px] tracking-overline uppercase font-semibold", variant === 'inverse' ? "text-brass-300" : "text-slate-500")}>
        {label}
      </div>
      <div className={cn("font-display text-[42px] leading-tight mt-2.5", fgClasses[tone || 'neutral'])}>
        <span className="font-mono font-medium">{isNeg ? "−" : ""}$</span>
        <span className="font-mono font-medium tabular-nums">{Math.abs(value).toLocaleString("es-CL")}</span>
      </div>
    </Card>
  );
};

const Shortcut = ({ k, label }: { k: string, label: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-slate-600">{label}</span>
    <kbd className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded-sm text-ink-900 font-bold shadow-sm">{k}</kbd>
  </div>
);
