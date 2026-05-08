'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Input, cn } from './Primitives';

interface RegisterTransaccionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const RegisterTransaccionModal = ({ open, onClose, onSuccess }: RegisterTransaccionModalProps) => {
  const [entity, setEntity] = useState('');
  const [entityId, setEntityId] = useState('');
  const [total, setTotal] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState<'contado' | 'crédito'>('contado');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-update payment date when payment terms change
  useEffect(() => {
    if (paymentTerms === 'contado') {
      setPaymentDate(todayISO());
    } else {
      setPaymentDate('');
    }
  }, [paymentTerms]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEntity('');
      setEntityId('');
      setTotal(0);
      setPaymentTerms('contado');
      setPaymentDate(todayISO());
      setNotes('');
      setPaymentMethod('Efectivo');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!entity || total <= 0 || !paymentDate) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      setError('Error al registrar la transacción. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[600px] animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">Nueva Transacción</div>
            <h2 className="font-display text-2xl mt-2 text-ink-900">Registrar Venta</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-ink-900 hover:border-slate-300 flex items-center justify-center transition-all"
            disabled={isSubmitting}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-coral-50 border border-coral-200 rounded-lg text-sm text-coral-900">
            {error}
          </div>
        )}

        {/* Form content */}
        <div className="mt-6 space-y-5">
          {/* Entity */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Entidad / Cliente *</label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-slate-400">
                <Icon name="users" size={16} />
              </span>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 pl-11 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                placeholder="Nombre de la empresa o cliente"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Monto Total *</label>
            <div className="relative">
              <span className="absolute top-2.5 left-3.5 text-slate-400 font-mono text-lg leading-none mt-0.5">$</span>
              <input
                type="number"
                className="w-full px-3.5 py-2.5 pl-7.5 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[18px] font-mono font-bold text-ink-900 tabular-nums"
                value={total || ''}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Medio de Pago *</label>
            <div className="relative">
              <select
                className="w-full px-3.5 py-2.5 pr-10 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans appearance-none"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isSubmitting}
              >
                <option>Efectivo</option>
                <option>Tarjeta de Crédito</option>
                <option>Tarjeta de Débito</option>
                <option>Transferencia Bancaria</option>
                <option>Crédito Directo</option>
              </select>
              <span className="absolute top-3 right-3.5 text-slate-400 pointer-events-none">
                <Icon name="chevronDown" size={16} />
              </span>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Términos de Pago *</label>
            <div className="relative">
              <select
                className="w-full px-3.5 py-2.5 pr-10 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans appearance-none"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as 'contado' | 'crédito')}
                disabled={isSubmitting}
              >
                <option value="contado">Contado (Pago inmediato)</option>
                <option value="crédito">Crédito (Pago diferido)</option>
              </select>
              <span className="absolute top-3 right-3.5 text-slate-400 pointer-events-none">
                <Icon name="chevronDown" size={16} />
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">
              Fecha de Pago {paymentTerms === 'crédito' && '*'}
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-slate-400">
                <Icon name="calendar" size={16} />
              </span>
              <input
                type="date"
                className={cn(
                  "w-full px-3.5 py-2.5 pl-11 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-mono tabular-nums",
                  paymentTerms === 'contado' && 'opacity-60 cursor-not-allowed'
                )}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={paymentTerms === 'contado' || isSubmitting}
              />
            </div>
            {paymentTerms === 'contado' && (
              <div className="text-xs text-slate-500">Se establece automáticamente al día actual para pagos en contado</div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] tracking-overline uppercase font-semibold text-ink-900">Notas</label>
            <textarea
              className="w-full px-3.5 py-3 rounded-sm border border-slate-200 bg-white outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all text-[15px] font-sans resize-none"
              rows={2}
              placeholder="Detalles adicionales de la transacción…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={isSubmitting || !entity || total <= 0 || !paymentDate}
            icon={isSubmitting ? undefined : 'check'}
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Transacción'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
