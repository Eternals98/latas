"use client";

import { useEffect, useMemo, useState } from "react";

type SalePayment = {
  id: string;
  payment_method_id: string;
  payment_method_name: string;
  amount: string;
};

type SaleItem = {
  id: string;
  company: { id: string; name: string };
  customer: { id: string; name: string; phone: string | null } | null;
  transaction_date: string;
  document_number: string | null;
  description: string;
  total_amount: string;
  status: string;
  created_at: string;
  payments: SalePayment[];
};

type SaleListResponse = {
  items: SaleItem[];
  total: number;
  limit: number;
  offset: number;
};

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

export default function TransaccionesRoutePage() {
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SaleItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  async function loadSales() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
        limit: "100",
        offset: "0",
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const response = await fetch(`/api/bff/sales?${params.toString()}`, { cache: "no-store" });
      const body = (await response.json()) as SaleListResponse | { detail?: string };
      if (!response.ok) {
        throw new Error((body as { detail?: string }).detail || "No fue posible cargar transacciones.");
      }
      setItems((body as SaleListResponse).items);
      setTotal((body as SaleListResponse).total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible cargar transacciones.");
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setIsDetailLoading(true);
    fetch(`/api/bff/sales/${selectedId}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as SaleItem | { detail?: string };
        if (!response.ok) {
          throw new Error((body as { detail?: string }).detail || "No fue posible cargar detalle.");
        }
        if (!cancelled) {
          setDetail(body as SaleItem);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No fue posible cargar detalle.");
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.total_amount || "0"), 0),
    [items],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-app-surface px-4 py-8 md:px-8">
      <header className="mb-5">
        <h1 className="font-manrope text-3xl font-extrabold text-slate-900">Transacciones</h1>
        <p className="mt-1 text-sm text-slate-600">Listado unificado sobre el contrato oficial de ventas.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por referencia, cliente o teléfono"
            className="h-10 rounded-lg border border-slate-300 px-3"
          />
          <button type="button" onClick={loadSales} className="h-10 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500">
            Filtrar
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-600">{isLoading ? "Cargando..." : `${total} registros`}</span>
          <span className="font-semibold text-slate-800">Total: {COP_FORMATTER.format(totalAmount)}</span>
        </div>
        {error && <p className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2">Fecha</th>
                <th className="py-2">Empresa</th>
                <th className="py-2">Cliente</th>
                <th className="py-2">Referencia</th>
                <th className="py-2">Total</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading &&
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">{formatDate(item.transaction_date)}</td>
                    <td className="py-2">{item.company.name}</td>
                    <td className="py-2">{item.customer?.name ?? "Cliente genérico"}</td>
                    <td className="py-2">{item.document_number ?? "-"}</td>
                    <td className="py-2">{COP_FORMATTER.format(Number(item.total_amount || "0"))}</td>
                    <td className="py-2">{item.status}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">Detalle de venta</h2>
            {isDetailLoading && <p className="mt-3 text-sm text-slate-600">Cargando detalle...</p>}
            {!isDetailLoading && detail && (
              <>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <p><strong>Empresa:</strong> {detail.company.name}</p>
                  <p><strong>Fecha:</strong> {formatDate(detail.transaction_date)}</p>
                  <p><strong>Cliente:</strong> {detail.customer?.name ?? "Cliente genérico"}</p>
                  <p><strong>Teléfono:</strong> {detail.customer?.phone ?? "-"}</p>
                  <p><strong>Referencia:</strong> {detail.document_number ?? "-"}</p>
                  <p><strong>Total:</strong> {COP_FORMATTER.format(Number(detail.total_amount || "0"))}</p>
                </div>
                <p className="mt-3 text-sm"><strong>Descripción:</strong> {detail.description}</p>
                <div className="mt-4 rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pagos
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {detail.payments.map((payment) => (
                      <li key={payment.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{payment.payment_method_name}</span>
                        <span>{COP_FORMATTER.format(Number(payment.amount || "0"))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
