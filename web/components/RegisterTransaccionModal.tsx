'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Icon, Input, Badge, cn } from './Primitives';
import { useSales } from '../lib/hooks';
import { getCsrfHeaders } from '../lib/csrf-client';

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

type PaymentMethodOption = { id: string; name: string };
type CompanyOption = { id: string; name: string };
type CustomerOption = { id: string; name: string; phone?: string | null };

type RegisterTransaccionModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  companies?: CompanyOption[];
  paymentMethods?: PaymentMethodOption[];
};

export const RegisterTransaccionModal = ({
  open,
  onClose,
  onSuccess,
  companies = [],
  paymentMethods = [],
}: RegisterTransaccionModalProps) => {
  // Form state
  const [companyId, setCompanyId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [documentNumber, setDocumentNumber] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'contado' | 'crédito'>('contado');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [payments, setPayments] = useState<Array<{ payment_method_id: string; amount: number }>>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');

  // Hook for mutation
  const { creating, error: hookError, success, createSale, reset } = useSales();
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update payment date when payment terms change
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
      // Clear form on close
      setValidationError(null);
    }
  }, [open]);

  // Handle success
  useEffect(() => {
    if (success) {
      // Clear form and call callback
      setCompanyId('');
      setCustomerId('');
      setTransactionDate(todayISO());
      setDocumentNumber('');
      setDescription('');
      setTotalAmount('');
      setPayments([]);
      setSelectedMethod('');
      setSelectedAmount('');
      setPaymentTerms('contado');
      setPaymentDate(todayISO());
      reset();
      onSuccess?.();
    }
  }, [success, onSuccess, reset]);

  const addPayment = () => {
    if (!selectedMethod || !selectedAmount) {
      setValidationError('Selecciona método y monto de pago');
      return;
    }
    const amount = Number(selectedAmount);
    if (isNaN(amount) || amount <= 0) {
      setValidationError('Monto debe ser mayor a 0');
      return;
    }
    setPayments([...payments, { payment_method_id: selectedMethod, amount }]);
    setSelectedMethod('');
    setSelectedAmount('');
    setValidationError(null);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setValidationError(null);

    // Validate required fields
    if (!companyId) {
      setValidationError('Empresa es requerida');
      return;
    }
    if (!description) {
      setValidationError('Descripción es requerida');
      return;
    }
    if (!totalAmount) {
      setValidationError('Monto total es requerido');
      return;
    }
    if (payments.length === 0) {
      setValidationError('Agrega al menos un método de pago');
      return;
    }

    const total = Number(totalAmount);
    const paymentSum = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentSum - total) > 0.01) {
      setValidationError(`Suma de pagos (${paymentSum}) debe igualar total (${total})`);
      return;
    }

    if (paymentTerms === 'crédito' && !paymentDate) {
      setValidationError('Fecha de pago es requerida para crédito');
      return;
    }

    // Submit
    await createSale({
      company_id: companyId,
      customer_id: customerId || undefined,
      transaction_date: transactionDate,
      document_number: documentNumber || undefined,
      description,
      total_amount: total,
      payments,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <h2 className="font-display text-2xl text-ink-900">Registrar Transacción</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white grid place-items-center cursor-pointer text-slate-600 hover:text-ink-900 transition-all"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Errors */}
        {(validationError || hookError) && (
          <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-lg text-sm text-coral-900">
            {validationError || hookError}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Company & Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Empresa *</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
              >
                <option value="">Seleccionar empresa</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente (Opcional)</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
              >
                <option value="">Sin cliente específico</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Transacción</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Referencia (Opcional)</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="INV-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <Input
            label="Descripción *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Venta de servicios"
          />

          {/* Total Amount */}
          <Input
            label="Monto Total *"
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0"
            prefix="$"
            mono
          />

          {/* Payment Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Términos de Pago *</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as 'contado' | 'crédito')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
              >
                <option value="contado">Contado</option>
                <option value="crédito">Crédito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Pago</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={paymentTerms === 'contado'}
                className={cn(
                  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm',
                  paymentTerms === 'contado' && 'bg-slate-100 cursor-not-allowed'
                )}
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Métodos de Pago *</label>
            <div className="space-y-2 mb-3">
              {payments.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No hay pagos agregados</p>
              ) : (
                payments.map((p, idx) => {
                  const methodName = paymentMethods.find((m) => m.id === p.payment_method_id)?.name || 'Desconocido';
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 bg-paper-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-ink-900">{methodName}</p>
                        <p className="text-xs text-slate-500">${p.amount.toLocaleString('es-CL')}</p>
                      </div>
                      <button
                        onClick={() => removePayment(idx)}
                        className="text-coral-600 hover:text-coral-700 transition-colors"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Payment Row */}
            <div className="space-y-2 p-3 bg-paper-100 rounded-lg border border-slate-200">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                >
                  <option value="">Seleccionar método</option>
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(e.target.value)}
                  placeholder="0"
                  className="px-2 py-1.5 border border-slate-200 rounded text-sm"
                />
              </div>
              <Button variant="accent" size="sm" className="w-full" onClick={addPayment} disabled={creating}>
                Agregar Pago
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={creating}>
            {creating ? 'Registrando...' : 'Registrar Venta'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
