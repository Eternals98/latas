'use client';

import React, { useState } from 'react';
import { Card, Button, Icon, Input, fmtMoney, cn } from './Primitives';
import type { CashSession } from '@/lib/hooks/useCash';

export type CashScreenProps = {
  session: CashSession | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  onOpen: (openingBalance: number) => Promise<boolean>;
  onClose: () => Promise<boolean>;
  onWithdraw: (amount: number, reason: string) => Promise<boolean>;
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
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawReason, setWithdrawReason] = useState('');

  const isClosed = !session || session.status === 'closed';
  const isOpen = session?.status === 'open';

  const handleOpen = async () => {
    const ok = await onOpen(openingBalance);
    if (ok) setOpeningBalance(0);
  };

  const handleClose = async () => {
    if (!window.confirm('¿Confirmar cierre de caja? Esta acción no se puede deshacer.')) return;
    await onClose();
  };

  const handleWithdraw = async () => {
    const ok = await onWithdraw(withdrawAmount, withdrawReason);
    if (ok) {
      setWithdrawAmount(0);
      setWithdrawReason('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-paper-100">
        <Card className="p-12 animate-pulse">
          <div className="w-1/3 h-8 mb-4 rounded bg-slate-200" />
          <div className="w-full h-4 mb-3 rounded bg-slate-100" />
          <div className="w-5/6 h-4 rounded bg-slate-100" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-8 pb-[100px] max-w-[1400px] mx-auto">
      {/* LEFT — main content */}
      <Card padding={0} className="relative overflow-hidden duration-500 animate-in fade-in">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brass-400" />

        <div className="p-8">
          {isClosed ? (
            /* Estado: Caja Cerrada */
            <div className="space-y-6">
              <h2 className="font-display text-[44px] leading-tight text-ink-900">Gestión de Caja</h2>
              <p className="text-base text-slate-600">La caja está actualmente cerrada. Abre la caja para comenzar a registrar operaciones.</p>

              <div className="p-6 mt-8 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-paper-50">
                <Icon name="box" size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-ink-900">Abrir Caja del Día</h3>
                <p className="mb-6 text-sm text-slate-600">Ingresa el saldo inicial en efectivo</p>

                <div className="max-w-xs mx-auto space-y-4">
                  <Input
                    label="Saldo inicial"
                    type="number"
                    prefix="$"
                    value={openingBalance || ''}
                    onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <Button
                    variant="accent"
                    size="lg"
                    disabled={openingBalance <= 0 || actionLoading}
                    onClick={handleOpen}
                    className="w-full"
                  >
                    {actionLoading ? 'Abriendo...' : 'Abrir Caja'}
                  </Button>
                </div>
              </div>
            </div>
          ) : isOpen ? (
            /* Estado: Caja Abierta */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[44px] leading-tight text-ink-900">Caja Abierta</h2>
                <div className="flex items-center gap-2 px-4 py-2 border bg-sage-50 text-sage-700 rounded-xl border-sage-200">
                  <Icon name="check" size={16} />
                  <span className="text-sm font-semibold">Operativa</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="p-4 border bg-paper-50 border-slate-200 rounded-xl">
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-600">Apertura</div>
                  <div className="font-mono text-2xl font-bold text-ink-900">
                    {fmtMoney(session.opening_balance)}
                  </div>
                </div>
                <div className="p-4 border bg-paper-50 border-slate-200 rounded-xl">
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-600">Ventas en Efectivo</div>
                  <div className="font-mono text-2xl font-bold text-sage-600">
                    {fmtMoney(session.total_sales_cash)}
                  </div>
                </div>
                <div className="p-4 border bg-paper-50 border-slate-200 rounded-xl">
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-600">Retiros</div>
                  <div className="font-mono text-2xl font-bold text-coral-600">
                    -{fmtMoney(session.total_withdrawals)}
                  </div>
                </div>
                <div className="p-4 border bg-brass-50 border-brass-300 rounded-xl">
                  <div className="mb-2 text-xs font-semibold uppercase text-brass-700">Saldo Actual</div>
                  <div className="font-mono text-2xl font-bold text-brass-900">
                    {fmtMoney(session.current_balance)}
                  </div>
                </div>
              </div>

              {/* Movimientos */}
              {session.movements && session.movements.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-semibold text-ink-900">Movimientos del día</h3>
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    {session.movements.map((mov, i) => {
                      const isNegative = ['withdrawal', 'close'].includes(mov.type);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 transition-colors border-b border-slate-100 last:border-0 hover:bg-paper-50"
                        >
                          <div className="flex items-center flex-1 gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                isNegative ? 'bg-coral-100 text-coral-600' : 'bg-sage-100 text-sage-600'
                              )}
                            >
                              <Icon
                                name={isNegative ? 'minus' : 'plus'}
                                size={16}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-ink-900">{movementLabel(mov.type)}</p>
                              <p className="text-xs text-slate-500">
                                {mov.description || new Date(mov.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className={cn('font-mono font-bold text-lg', isNegative ? 'text-coral-600' : 'text-sage-600')}>
                            {isNegative ? '-' : '+'}{fmtMoney(mov.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formulario de retiro */}
              <div className="p-6 mt-8 border bg-paper-50 border-slate-200 rounded-xl">
                <h3 className="mb-4 text-lg font-semibold text-ink-900">Registrar Retiro</h3>
                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  <Input
                    label="Monto del retiro"
                    type="number"
                    prefix="$"
                    value={withdrawAmount || ''}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <Input
                    label="Motivo"
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="Ej: Depósito en banco"
                  />
                </div>
                <Button
                  variant="primary"
                  disabled={actionLoading || withdrawAmount <= 0 || !withdrawReason.trim()}
                  onClick={handleWithdraw}
                >
                  {actionLoading ? 'Registrando...' : 'Registrar Retiro'}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 mt-6 border bg-coral-50 border-coral-500/30 text-coral-700 rounded-xl">
              <Icon name="x" size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </Card>

      {/* RIGHT — sidebar */}
      {isOpen && (
        <aside className="self-start lg:sticky lg:top-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-ink-900">Acciones</h3>
            <Button
              variant="danger"
              size="lg"
              onClick={handleClose}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? 'Cerrando...' : 'Cerrar Caja'}
            </Button>
            <p className="text-xs text-center text-slate-500">
              Confirma el saldo y cierra la sesión del día.
            </p>
          </Card>
        </aside>
      )}
    </div>
  );
};

const movementLabel = (type: string): string => {
  const labels: Record<string, string> = {
    open: 'Apertura de caja',
    deposit: 'Depósito',
    withdrawal: 'Retiro',
    adjustment: 'Ajuste',
    close: 'Cierre de caja',
  };
  return labels[type] || type;
};