'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, Icon, Input, cn } from './Primitives';
import type { SaleCreateRequest } from '@/lib/hooks/useSales';

export type SaleScreenProps = {
  cashOpen: boolean;
  openCash: () => void;
  companies: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string; document?: string }>;
  paymentMethods: Array<{ id: string; name: string; requires_cash: boolean }>;
  defaultCompanyId?: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: SaleCreateRequest) => Promise<void>;
  onCancel?: () => void;
};

export const SaleScreen = ({
  cashOpen,
  openCash,
  companies,
  customers,
  paymentMethods,
  defaultCompanyId,
  submitting,
  error,
  onSubmit,
  onCancel,
}: SaleScreenProps) => {
  const [companyId, setCompanyId] = useState<string>(defaultCompanyId ?? companies[0]?.id ?? '');
  const [customerId, setCustomerId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [documentNumber, setDocumentNumber] = useState('');
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<Array<{ paymentMethodId: string; amount: number }>>([
    { paymentMethodId: paymentMethods[0]?.id ?? '', amount: 0 },
  ]);

  const paid = useMemo(() => rows.reduce((a, r) => a + (Number(r.amount) || 0), 0), [rows]);
  const diff = total - paid;

  const addRow = () => setRows([...rows, { paymentMethodId: paymentMethods[0]?.id ?? '', amount: 0 }]);
  const updateRow = (i: number, k: string, v: any) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const cashLocked = !cashOpen && rows.some((r) => {
    const pm = paymentMethods.find((p) => p.id === r.paymentMethodId);
    return pm?.requires_cash && r.amount > 0;
  });

  const handleSubmit = async () => {
    if (diff !== 0 || cashLocked || submitting) return;
    if (!companyId || !description.trim() || rows.length === 0) return;
    await onSubmit({
      company_id: companyId,
      customer_id: customerId || undefined,
      transaction_date: transactionDate,
      document_number: documentNumber || undefined,
      description,
      total_amount: total,
      payments: rows.map((r) => ({ payment_method_id: r.paymentMethodId, amount: r.amount })),
    });
  };

  const resetForm = () => {
    setCustomerId('');
    setDescription('');
    setDocumentNumber('');
    setTotal(0);
    setRows([{ paymentMethodId: paymentMethods[0]?.id ?? '', amount: 0 }]);
    onCancel?.();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-8 pb-[100px] max-w-[1400px] mx-auto">
      {/* LEFT — form */}
      <Card padding={0} className="relative overflow-hidden duration-500 animate-in fade-in">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brass-400" />

        <div className="p-8">
          <h2 className="font-display text-[44px] leading-tight text-ink-900">Nueva venta</h2>

          <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-xs font-semibold text-ink-900">Empresa</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-ink-900">Cliente</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
              >
                <option value="">-- Seleccionar --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-ink-900">Fecha</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-ink-900">Total</label>
              <input
                type="number"
                value={total || ''}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-xs font-semibold text-ink-900">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-3 bg-white border rounded-sm resize-none border-slate-200"
              />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 mt-6 border bg-coral-50 border-coral-500/30 text-coral-700 rounded-xl">
              <Icon name="x" size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Cash warning */}
          {cashLocked && (
            <div className="flex items-center gap-4 p-4 mt-6 border bg-coral-50 border-coral-500/20 text-coral-700 rounded-xl">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-coral-100">
                <Icon name="x" size={20} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[15px]">Caja cerrada</div>
                <div className="text-sm opacity-90">No se pueden registrar pagos en efectivo sin caja abierta.</div>
              </div>
              <Button variant="danger" size="sm" onClick={openCash}>
                Abrir caja
              </Button>
            </div>
          )}

          {/* Payment methods table */}
          <div className="mt-8 overflow-hidden border border-slate-200 rounded-xl">
            <div className="flex items-center px-5 py-4 border-b bg-paper-50 border-slate-200">
              <div className="text-xs font-semibold uppercase text-ink-900">Métodos de pago</div>
              <Button variant="text" size="sm" onClick={addRow} className="ml-auto text-brass-600">
                <Icon name="plus" size={16} /> Agregar
              </Button>
            </div>

            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_48px] gap-4 p-4 border-b border-slate-100 items-center last:border-0">
                <select
                  value={r.paymentMethodId}
                  onChange={(e) => updateRow(i, 'paymentMethodId', e.target.value)}
                  className="px-3 py-2 text-sm bg-white border rounded-sm border-slate-200"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={r.amount || ''}
                  onChange={(e) => updateRow(i, 'amount', Number(e.target.value) || 0)}
                  className="px-3 py-2 text-right bg-white border rounded-sm border-slate-200"
                />

                <button
                  onClick={() => removeRow(i)}
                  className="flex items-center justify-center border rounded-lg w-9 h-9 bg-paper-100 border-slate-200 text-slate-500 hover:text-coral-600"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between px-5 py-4 border-t bg-paper-50 border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Total asignado</span>
              <span className="font-mono text-lg font-extrabold text-ink-900">$ {paid.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* RIGHT — summary */}
      <aside className="flex flex-col self-start gap-4 lg:sticky lg:top-6">
        <SummaryCard label="Total venta" value={total} />
        <SummaryCard label="Cubierto" value={paid} />
        <SummaryCard
          label={diff === 0 ? 'Balance exacto' : diff > 0 ? 'Pendiente' : 'Vuelto'}
          value={diff}
          tone={diff === 0 ? 'success' : diff > 0 ? 'danger' : 'success'}
        />

        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="accent"
            size="lg"
            disabled={cashLocked || diff !== 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Registrando...' : 'Registrar venta'}
          </Button>
          <Button variant="ghost" size="lg" onClick={resetForm}>
            Cancelar
          </Button>
        </div>
      </aside>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'success' | 'danger' | 'neutral';
}) => {
  const toneColor =
    tone === 'danger' ? 'text-coral-600' : tone === 'success' ? 'text-sage-600' : 'text-ink-900';

  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className={cn('font-display text-3xl font-semibold mt-2', toneColor)}>
        $ {Math.abs(value).toLocaleString('es-CO')}
      </div>
    </Card>
  );
};