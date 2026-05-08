'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Icon, Input, fmtMoney, cn } from './Primitives';

export const CashScreen = ({ cashOpen, openCash, closeCash }: { cashOpen: boolean, openCash: () => void, closeCash: () => void }) => {
  const [openingBalance] = useState(150000);
  const [salesCash]      = useState(84200);
  const [withdrawals]    = useState(3200);
  
  const currentBalance = openingBalance + salesCash - withdrawals;

  return (
    <div className="p-8 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8">
        <div className="flex flex-col gap-6">
          <Card variant="ledger" className="p-8 shadow-elev-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Estado de la Caja</div>
                <h2 className="font-display text-3xl mt-2 text-ink-900">{cashOpen ? "Caja Abierta" : "Caja Cerrada"}</h2>
              </div>
              <Badge tone={cashOpen ? "success" : "danger"}>{cashOpen ? "En Operación" : "Inactiva"}</Badge>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-6">
              <StatBlock label="Apertura" value={fmtMoney(openingBalance)} />
              <StatBlock label="Ventas (Efectivo)" value={fmtMoney(salesCash)} tone="sage" />
              <StatBlock label="Retiros / Gastos" value={fmtMoney(withdrawals)} tone="coral" />
              <StatBlock label="Saldo Actual" value={fmtMoney(currentBalance)} bold />
            </div>

            <div className="mt-10 flex gap-3">
              {cashOpen ? (
                <Button variant="danger" icon="x" onClick={closeCash} className="flex-1">Cerrar Caja (Arqueo)</Button>
              ) : (
                <Button variant="accent" icon="check" onClick={openCash} className="flex-1">Abrir Caja del Día</Button>
              )}
              <Button variant="ghost" icon="print">Imprimir X</Button>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-4">Movimientos de Efectivo</div>
            <div className="flex flex-col divide-y divide-slate-100">
              <MovementRow label="Retiro para sencillo" amount={-1200} time="14:20" user="M. Gonzalez" />
              <MovementRow label="Venta #TX-9941" amount={8920} time="12:15" user="M. Gonzalez" />
              <MovementRow label="Venta #TX-9939" amount={3200} time="10:04" user="M. Gonzalez" />
              <MovementRow label="Apertura de caja" amount={150000} time="08:14" user="System" />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="bg-paper-50 border-slate-200">
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-4">Registro de Retiro</div>
            <div className="flex flex-col gap-4">
              <Input label="Monto del retiro" prefix="$" mono placeholder="0" />
              <Input label="Motivo" placeholder="Ej. Pago proveedor, sencillo..." />
              <Button variant="primary" className="w-full">Registrar Salida</Button>
            </div>
          </Card>

          <Card variant="sunken" className="p-5">
            <div className="flex gap-3 items-start text-slate-600">
              <Icon name="info" size={18} className="mt-0.5" />
              <div className="text-sm leading-relaxed">
                El arqueo de caja debe realizarse al finalizar cada turno. Asegúrese de contar el efectivo físico antes de cerrar.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatBlock = ({ label, value, tone, bold }: { label: string, value: string, tone?: 'sage' | 'coral', bold?: boolean }) => (
  <div>
    <div className="text-[10px] tracking-overline uppercase font-bold text-slate-500">{label}</div>
    <div className={cn(
      "font-mono tabular-nums mt-1",
      bold ? "text-2xl font-extrabold" : "text-lg font-semibold",
      tone === "sage" ? "text-sage-600" : tone === "coral" ? "text-coral-600" : "text-ink-900"
    )}>{value}</div>
  </div>
);

const MovementRow = ({ label, amount, time, user }: { label: string, amount: number, time: string, user: string }) => (
  <div className="flex justify-between items-center py-3">
    <div>
      <div className="text-sm font-semibold text-ink-900">{label}</div>
      <div className="text-[11px] text-slate-500 font-medium">{time} · {user}</div>
    </div>
    <div className={cn(
      "font-mono font-bold tabular-nums",
      amount < 0 ? "text-coral-600" : "text-sage-600"
    )}>
      {amount < 0 ? "−" : "+"}{fmtMoney(Math.abs(amount))}
    </div>
  </div>
);
