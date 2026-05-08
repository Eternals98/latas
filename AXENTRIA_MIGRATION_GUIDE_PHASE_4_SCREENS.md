# Axentria Design → Next.js Web
## PHASE 4: Complex Screens & Components

**Versión:** 1.0  
**Duración:** 2-2.5 horas  
**Objetivo:** Crear screens complejos usando componentes primitivos

---

## 📋 Tabla de Contenidos

1. [Arquitectura de Screens](#arquitectura-de-screens)
2. [LoginScreen](#loginscreen)
3. [SaleScreen](#salesscreen)
4. [DashboardScreen](#dashboardscreen)
5. [CashScreen](#cashscreen)
6. [TransactionsScreen](#transactionsscreen)
7. [Shell/AppShell](#shellappshell)
8. [Checklist de Phase 4](#checklist)

---

## Arquitectura de Screens

### Patrón: Controlled Screen Components

Cada Screen es un componente **controlado** que:
- Recibe datos como **props**
- Recibe callbacks para acciones
- **No** tiene lógica de datos (eso va en hooks)
- Es **puramente visual**

```typescript
// ❌ MAL - Lógica en el componente
export const SaleScreen = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/sales').then(res => res.json()).then(setSales);
  }, []);
  // ... mucho código
};

// ✅ BIEN - Props controladas
export type SaleScreenProps = {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  onCreateSale: (payload: SaleCreateRequest) => Promise<void>;
};

export const SaleScreen = ({ sales, loading, error, onCreateSale }: SaleScreenProps) => {
  // Solo renderiza, no obtiene datos
};
```

---

## LoginScreen

**`components/LoginScreen.tsx`:**

```typescript
'use client';

import React, { useState } from 'react';
import { Icon, Input, Button, BrandMark, BrandLogo } from './Primitives';

export type LoginScreenProps = {
  mode?: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
};

export const LoginScreen = ({
  mode = 'login',
  onSubmit,
  loading,
  error,
}: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isRegister = mode === 'register';
  const canSubmit = email && password && (!isRegister || name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      email,
      password,
      name: isRegister ? name : undefined,
    });
  };

  return (
    <div className="paper-grain min-h-full grid place-items-center p-8 bg-paper-100">
      <div className="w-[440px] font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-ink-900 grid place-items-center shadow-3 p-3.5 mb-5">
            <BrandMark color="var(--paper-50)" size={42} />
          </div>
          <div className="text-center">
            <BrandLogo height={32} color="var(--ink-900)" className="mb-2" />
            <div className="text-base text-slate-500 font-display italic">
              El libro de ventas, hecho aplicación.
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 pb-7 border border-slate-200 shadow-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brass-400" />
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-6">
            {isRegister ? 'Crear cuenta' : 'Acceso al sistema'}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-lg mb-6">
              <Icon name="x" size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="flex flex-col gap-[18px]">
            {isRegister && (
              <Input
                label="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                prefix={<Icon name="user" size={16} />}
              />
            )}

            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              prefix={<Icon name="user" size={16} />}
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              prefix={<Icon name="lock" size={16} />}
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={!canSubmit || loading}
              className="mt-2"
            >
              {loading ? 'Entrando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {isRegister ? (
              <>
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="font-semibold text-brass-600 hover:text-brass-700">
                  Inicia sesión
                </a>
              </>
            ) : (
              <>
                ¿No tienes cuenta?{' '}
                <a href="/registro" className="font-semibold text-brass-600 hover:text-brass-700">
                  Crea una
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## SaleScreen

**`components/SaleScreen.tsx`:** (versión simplificada)

```typescript
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
      <Card padding={0} className="relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brass-400" />

        <div className="p-8">
          <h2 className="font-display text-[44px] leading-tight text-ink-900">Nueva venta</h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-ink-900 block mb-2">Empresa</label>
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
              <label className="text-xs font-semibold text-ink-900 block mb-2">Cliente</label>
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
              <label className="text-xs font-semibold text-ink-900 block mb-2">Fecha</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-900 block mb-2">Total</label>
              <input
                type="number"
                value={total || ''}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-ink-900 block mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-3 rounded-sm border border-slate-200 bg-white resize-none"
              />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-xl mt-6">
              <Icon name="x" size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Cash warning */}
          {cashLocked && (
            <div className="flex items-center gap-4 bg-coral-50 border border-coral-500/20 text-coral-700 p-4 rounded-xl mt-6">
              <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center flex-shrink-0">
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
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center px-5 py-4 bg-paper-50 border-b border-slate-200">
              <div className="text-xs font-semibold text-ink-900 uppercase">Métodos de pago</div>
              <Button variant="text" size="sm" onClick={addRow} className="ml-auto text-brass-600">
                <Icon name="plus" size={16} /> Agregar
              </Button>
            </div>

            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_48px] gap-4 p-4 border-b border-slate-100 items-center last:border-0">
                <select
                  value={r.paymentMethodId}
                  onChange={(e) => updateRow(i, 'paymentMethodId', e.target.value)}
                  className="px-3 py-2 rounded-sm border border-slate-200 bg-white text-sm"
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
                  className="px-3 py-2 rounded-sm border border-slate-200 bg-white text-right"
                />

                <button
                  onClick={() => removeRow(i)}
                  className="w-9 h-9 rounded-lg bg-paper-100 border border-slate-200 text-slate-500 hover:text-coral-600 flex items-center justify-center"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}

            <div className="flex justify-between items-center px-5 py-4 bg-paper-50 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Total asignado</span>
              <span className="font-mono font-extrabold text-lg text-ink-900">$ {paid.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* RIGHT — summary */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 self-start">
        <SummaryCard label="Total venta" value={total} />
        <SummaryCard label="Cubierto" value={paid} />
        <SummaryCard
          label={diff === 0 ? 'Balance exacto' : diff > 0 ? 'Pendiente' : 'Vuelto'}
          value={diff}
          tone={diff === 0 ? 'success' : diff > 0 ? 'danger' : 'success'}
        />

        <div className="mt-4 flex flex-col gap-3">
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
      <div className="text-xs font-semibold text-slate-500 uppercase">{label}</div>
      <div className={cn('font-display text-3xl font-semibold mt-2', toneColor)}>
        $ {Math.abs(value).toLocaleString('es-CO')}
      </div>
    </Card>
  );
};
```

---

## DashboardScreen

**`components/DashboardScreen.tsx`:** (estructura básica)

```typescript
'use client';

import React from 'react';
import { Card, Icon } from './Primitives';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export type DashboardScreenProps = {
  metrics: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    salesCount: number;
    chartData: Array<{ date: string; sales: number; revenue: number }>;
  };
  loading: boolean;
};

export const DashboardScreen = ({ metrics, loading }: DashboardScreenProps) => {
  if (loading) {
    return <div className="p-8 animate-pulse">Cargando métricas...</div>;
  }

  return (
    <div className="p-8 bg-paper-100 min-h-screen">
      <h1 className="text-4xl font-display font-bold text-ink-900 mb-8">Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard label="Total ventas" value={metrics.totalSales} icon="receipt" />
        <MetricCard label="Ingresos" value={metrics.totalRevenue} icon="dollarSign" />
        <MetricCard label="Ticket promedio" value={metrics.averageTicket} icon="activity" />
        <MetricCard label="Transacciones" value={metrics.salesCount} icon="list" />
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-ink-900 mb-6">Ventas últimos 30 días</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.chartData}>
            <CartesianGrid stroke="var(--border-default)" />
            <XAxis dataKey="date" stroke="var(--fg-2)" />
            <YAxis stroke="var(--fg-2)" />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="var(--brass-400)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink-900">{value.toLocaleString('es-CO')}</p>
      </div>
      <Icon name={icon as any} size={24} className="text-brass-400" />
    </div>
  </Card>
);
```

---

## CashScreen

**`components/CashScreen.tsx`:**

```typescript
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
      <div className="p-8 bg-paper-100 min-h-screen">
        <Card className="p-12 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-full mb-3" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-8 pb-[100px] max-w-[1400px] mx-auto">
      {/* LEFT — main content */}
      <Card padding={0} className="relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brass-400" />

        <div className="p-8">
          {isClosed ? (
            /* Estado: Caja Cerrada */
            <div className="space-y-6">
              <h2 className="font-display text-[44px] leading-tight text-ink-900">Gestión de Caja</h2>
              <p className="text-slate-600 text-base">La caja está actualmente cerrada. Abre la caja para comenzar a registrar operaciones.</p>

              <div className="mt-8 p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-paper-50 text-center">
                <Icon name="box" size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-ink-900 mb-2">Abrir Caja del Día</h3>
                <p className="text-sm text-slate-600 mb-6">Ingresa el saldo inicial en efectivo</p>

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
                <div className="flex items-center gap-2 bg-sage-50 text-sage-700 px-4 py-2 rounded-xl border border-sage-200">
                  <Icon name="check" size={16} />
                  <span className="text-sm font-semibold">Operativa</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-paper-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 uppercase mb-2">Apertura</div>
                  <div className="font-mono text-2xl font-bold text-ink-900">
                    {fmtMoney(session.opening_balance)}
                  </div>
                </div>
                <div className="p-4 bg-paper-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 uppercase mb-2">Ventas en Efectivo</div>
                  <div className="font-mono text-2xl font-bold text-sage-600">
                    {fmtMoney(session.total_sales_cash)}
                  </div>
                </div>
                <div className="p-4 bg-paper-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-600 uppercase mb-2">Retiros</div>
                  <div className="font-mono text-2xl font-bold text-coral-600">
                    -{fmtMoney(session.total_withdrawals)}
                  </div>
                </div>
                <div className="p-4 bg-brass-50 border border-brass-300 rounded-xl">
                  <div className="text-xs font-semibold text-brass-700 uppercase mb-2">Saldo Actual</div>
                  <div className="font-mono text-2xl font-bold text-brass-900">
                    {fmtMoney(session.current_balance)}
                  </div>
                </div>
              </div>

              {/* Movimientos */}
              {session.movements && session.movements.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-ink-900 mb-4">Movimientos del día</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {session.movements.map((mov, i) => {
                      const isNegative = ['withdrawal', 'close'].includes(mov.type);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-paper-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
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
                              <p className="font-semibold text-sm text-ink-900">{movementLabel(mov.type)}</p>
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
              <div className="mt-8 p-6 bg-paper-50 border border-slate-200 rounded-xl">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">Registrar Retiro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-xl mt-6">
              <Icon name="x" size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </Card>

      {/* RIGHT — sidebar */}
      {isOpen && (
        <aside className="lg:sticky lg:top-6 self-start">
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
            <p className="text-xs text-slate-500 text-center">
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
```

---

## TransactionsScreen

**`components/TransactionsScreen.tsx`:**

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, Icon, Input, Badge, fmtMoney, cn } from './Primitives';
import type { Transaction } from '@/lib/hooks/useTransactions';

export type TransactionsScreenProps = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => Promise<boolean>;
};

export const TransactionsScreen = ({
  transactions,
  loading,
  error,
  onEdit,
  onCancel,
}: TransactionsScreenProps) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activo' | 'anulado'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (
        search &&
        !t.document_number?.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      // Status
      if (filterStatus !== 'all' && t.status !== filterStatus) {
        return false;
      }

      // Date range
      if (filterDateFrom && t.transaction_date < filterDateFrom) return false;
      if (filterDateTo && t.transaction_date > filterDateTo) return false;

      return true;
    });
  }, [transactions, search, filterStatus, filterDateFrom, filterDateTo]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Anular esta transacción? Esta acción no se puede deshacer.')) return;
    setActionLoading(id);
    try {
      if (onCancel) {
        const ok = await onCancel(id);
        if (!ok) console.error('Failed to cancel transaction');
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-paper-100 min-h-screen">
        <Card className="p-12 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 bg-paper-100 min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-ink-900 mb-2">Transacciones</h1>
          <p className="text-slate-600">Historial y gestión de todas las operaciones registradas</p>
        </div>

        {/* Filters */}
        <Card padding={0} className="overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-paper-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Buscar por documento o descripción"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="INV-2026-001, venta..."
                prefix={<Icon name="search" size={16} />}
              />

              <div>
                <label className="text-xs font-semibold text-ink-900 block mb-2">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
                >
                  <option value="all">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="anulado">Anulado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-900 block mb-2">Desde</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-900 block mb-2">Hasta</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="inbox" size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold">Sin transacciones para los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-paper-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-900">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-900">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-ink-900">Fecha</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-ink-900">Monto</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-ink-900">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-ink-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-paper-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-ink-900">
                          {t.document_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-ink-900">{t.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {new Date(t.transaction_date).toLocaleDateString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-ink-900">{fmtMoney(t.total_amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          tone={t.status === 'activo' ? 'success' : 'danger'}
                          label={t.status === 'activo' ? 'Activo' : 'Anulado'}
                        />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {t.status === 'activo' && (
                          <>
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => onEdit?.(t.id)}
                              icon="edit"
                            />
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => handleCancel(t.id)}
                              disabled={actionLoading === t.id}
                              className="text-coral-600 hover:text-coral-700"
                              icon="trash"
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-xl">
            <Icon name="x" size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Shell/AppShell

**`components/Shell.tsx`:**

```typescript
'use client';

import React, { useState } from 'react';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button, Avatar } from './Primitives';

export const Shell = ({
  children,
  role = 'cashier',
}: {
  children: ReactNode;
  role?: 'admin' | 'cashier';
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const navItems =
    role === 'admin'
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: 'barChart' },
          { href: '/transactions', label: 'Transacciones', icon: 'list' },
          { href: '/reportes', label: 'Reportes', icon: 'receipt' },
        ]
      : [
          { href: '/salesRegister', label: 'Nueva venta', icon: 'dollarSign' },
          { href: '/cash-management', label: 'Caja', icon: 'box' },
          { href: '/transactions', label: 'Historial', icon: 'list' },
        ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-paper-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-ink-900 text-paper-50 flex flex-col`}
      >
        <div className="p-4 border-b border-ink-800">
          <div className="text-xl font-bold">LATAS</div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-ink-800 transition-colors"
            >
              <Icon name={item.icon as any} size={20} />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-ink-800 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start border-paper-50 text-paper-50 hover:bg-ink-800"
          >
            <Icon name="logOut" size={16} />
            {sidebarOpen && 'Salir'}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <Button variant="text" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name="list" size={20} />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar initials="JD" size="sm" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
```

---

## Checklist

- [ ] `components/LoginScreen.tsx` creado y funcional
- [ ] `components/SaleScreen.tsx` con todos los campos
- [ ] `components/DashboardScreen.tsx` con métricas y gráficos
- [ ] `components/CashScreen.tsx` con lógica de sesiones
- [ ] `components/TransactionsScreen.tsx` con tabla y filtros
- [ ] `components/Shell.tsx` con sidebar y topbar
- [ ] Navegación funciona entre screens
- [ ] Screens responden a props correctamente
- [ ] Estilos Axentria aplicados en todos
- [ ] Animaciones y transiciones suaves
- [ ] Estados de carga/error muestran correctamente

---

**Estado:** ✅ Phase 4 Complete  
**Duración estimada:** 2-2.5 horas  
**Siguiente:** Phase 5 - Data Hooks
