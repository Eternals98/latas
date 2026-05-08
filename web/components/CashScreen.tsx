'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Icon, Input, fmtMoney, cn } from './Primitives';
import type { CashSession } from '../lib/hooks/useCash';

export type CashScreenProps = {
  session: CashSession | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  onOpen: (opening_balance: number) => Promise<boolean>;
  onClose: () => Promise<boolean>;
  onWithdraw: (amount: number, description: string) => Promise<boolean>;
};

export const CashScreen = ({
  session,
  loading,
  actionLoading,
  error,
  onOpen,
  onClose,
  onWithdraw,
}: CashScreenProps) => {
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawReason, setWithdrawReason] = useState('');

  const isOpen = session?.status === 'open';

  const handleOpen = async () => {
    if (openingAmount <= 0) return;
    const ok = await onOpen(openingAmount);
    if (ok) {
      setOpeningAmount(0);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('¿Confirmar cierre de caja? Esta acción no se puede deshacer.')) return;
    await onClose();
  };

  const handleWithdraw = async () => {
    if (withdrawAmount <= 0 || !withdrawReason.trim()) return;
    const ok = await onWithdraw(withdrawAmount, withdrawReason);
    if (ok) {
      setWithdrawAmount(0);
      setWithdrawReason('');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8">
          <Card className="h-80 animate-pulse bg-paper-200"><div /></Card>
          <div className="flex flex-col gap-6">
            <Card className="h-40 animate-pulse bg-paper-200"><div /></Card>
            <Card className="h-40 animate-pulse bg-paper-200"><div /></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen && !session) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto animate-in fade-in duration-500">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Caja Cerrada</div>
            <h2 className="font-display text-3xl mt-2 text-ink-900">Abrir Caja</h2>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-xl mb-6">
              <Icon name="x" size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input
              label="Monto de apertura"
              prefix="$"
              mono
              type="number"
              value={openingAmount ? String(openingAmount) : ''}
              onChange={(e) => setOpeningAmount(Number(e.target.value) || 0)}
              placeholder="0"
            />
            <Button
              variant="accent"
              className="w-full"
              disabled={actionLoading || openingAmount <= 0}
              icon={actionLoading ? 'spinner' : 'check'}
              onClick={handleOpen}
            >
              {actionLoading ? 'Abriendo...' : 'Abrir Caja del Día'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8">
        <div className="flex flex-col gap-6">
          <Card variant="ledger" className="p-8 shadow-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Estado de la Caja</div>
                <h2 className="font-display text-3xl mt-2 text-ink-900">Caja Abierta</h2>
              </div>
              <Badge tone="success">En Operación</Badge>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <StatBlock label="Apertura" value={fmtMoney(session?.opening_balance ?? 0)} />
              <StatBlock label="Ventas (Efectivo)" value={fmtMoney(session?.total_sales_cash ?? 0)} tone="sage" />
              <StatBlock label="Retiros / Gastos" value={fmtMoney(session?.total_withdrawals ?? 0)} tone="coral" />
              <StatBlock label="Saldo Actual" value={fmtMoney(session?.current_balance ?? 0)} bold />
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-xl mt-6">
                <Icon name="x" size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="mt-10 flex gap-3">
              <Button
                variant="danger"
                icon="x"
                onClick={handleClose}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? 'Cerrando...' : 'Cerrar Caja (Arqueo)'}
              </Button>
              <Button variant="ghost" icon="print">Imprimir X</Button>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-4">Movimientos de Efectivo</div>
            <div className="flex flex-col divide-y divide-slate-100">
              {(session?.movements ?? []).length > 0 ? (
                session?.movements.map((mov) => (
                  <MovementRow
                    key={mov.id}
                    label={mov.description || labelByType(mov.movement_type)}
                    amount={signByType(mov.movement_type) * mov.amount}
                    time={new Date(mov.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              ) : (
                <div className="py-6 text-center text-slate-500 text-sm">Sin movimientos registrados</div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="bg-paper-50 border-slate-200">
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-4">Registro de Retiro</div>
            <div className="flex flex-col gap-4">
              <Input
                label="Monto del retiro"
                prefix="$"
                mono
                type="number"
                value={withdrawAmount ? String(withdrawAmount) : ''}
                onChange={(e) => setWithdrawAmount(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <Input
                label="Motivo"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Ej. Pago proveedor, sencillo..."
              />
              <Button
                variant="primary"
                className="w-full"
                disabled={actionLoading || withdrawAmount <= 0 || !withdrawReason.trim()}
                icon={actionLoading ? 'spinner' : 'check'}
                onClick={handleWithdraw}
              >
                {actionLoading ? 'Registrando...' : 'Registrar Salida'}
              </Button>
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

const labelByType = (type: string): string => {
  const map: Record<string, string> = {
    open: 'Apertura de caja',
    deposit: 'Depósito',
    withdrawal: 'Retiro',
    adjustment: 'Ajuste',
    close: 'Cierre de caja',
  };
  return map[type] ?? type;
};

const signByType = (type: string): number => {
  return type === 'withdrawal' || type === 'close' ? -1 : 1;
};

const MovementRow = ({ label, amount, time }: { label: string, amount: number, time: string }) => (
  <div className="flex justify-between items-center py-3">
    <div>
      <div className="text-sm font-semibold text-ink-900">{label}</div>
      <div className="text-[11px] text-slate-500 font-medium">{time}</div>
    </div>
    <div className={cn(
      "font-mono font-bold tabular-nums",
      amount < 0 ? "text-coral-600" : "text-sage-600"
    )}>
      {amount < 0 ? "−" : "+"}{fmtMoney(Math.abs(amount))}
    </div>
  </div>
);
