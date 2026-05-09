use client';

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
      <div className="min-h-screen p-8 bg-paper-100">
        <Card className="p-12 animate-pulse">
          <div className="w-1/3 h-8 mb-4 rounded bg-slate-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded bg-slate-100" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-paper-100">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="mb-2 text-4xl font-bold font-display text-ink-900">Transacciones</h1>
          <p className="text-slate-600">Historial y gestión de todas las operaciones registradas</p>
        </div>

        {/* Filters */}
        <Card padding={0} className="overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-paper-50">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Buscar por documento o descripción"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="INV-2026-001, venta..."
                prefix={<Icon name="search" size={16} />}
              />

              <div>
                <label className="block mb-2 text-xs font-semibold text-ink-900">Estado</label>
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
                <label className="block mb-2 text-xs font-semibold text-ink-900">Desde</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-sm border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-semibold text-ink-900">Hasta</label>
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
              <Icon name="inbox" size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-semibold text-slate-600">Sin transacciones para los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-paper-50">
                    <th className="px-6 py-3 text-xs font-semibold text-left text-ink-900">Documento</th>
                    <th className="px-6 py-3 text-xs font-semibold text-left text-ink-900">Descripción</th>
                    <th className="px-6 py-3 text-xs font-semibold text-left text-ink-900">Fecha</th>
                    <th className="px-6 py-3 text-xs font-semibold text-right text-ink-900">Monto</th>
                    <th className="px-6 py-3 text-xs font-semibold text-center text-ink-900">Estado</th>
                    <th className="px-6 py-3 text-xs font-semibold text-right text-ink-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="transition-colors border-b border-slate-100 hover:bg-paper-50">
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
                      <td className="px-6 py-4 space-x-2 text-right">
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
          <div className="flex items-center gap-3 p-4 border bg-coral-50 border-coral-500/30 text-coral-700 rounded-xl">
            <Icon name="x" size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};