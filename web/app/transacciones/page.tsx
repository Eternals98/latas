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

function formatStatus(status: string): string {
  return status === "confirmed"
    ? "Confirmada"
    : status === "cancelled"
      ? "Cancelada"
      : status;
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
      const response = await fetch(`/api/bff/sales?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await response.json()) as
        | SaleListResponse
        | { detail?: string };
      if (!response.ok) {
        throw new Error(
          (body as { detail?: string }).detail ||
            "No fue posible cargar transacciones.",
        );
      }
      setItems((body as SaleListResponse).items);
      setTotal((body as SaleListResponse).total);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible cargar transacciones.",
      );
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
          throw new Error(
            (body as { detail?: string }).detail ||
              "No fue posible cargar detalle.",
          );
        }
        if (!cancelled) {
          setDetail(body as SaleItem);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No fue posible cargar detalle.",
          );
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
    <main className="min-h-[calc(100vh-56px)] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-4 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-7xl flex-col gap-4">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Contrato oficial
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Transacciones
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Listado y detalle sobre el contrato final de ventas.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                {total} registros
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                {COP_FORMATTER.format(totalAmount)}
              </span>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto]">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por referencia, cliente o teléfono"
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={loadSales}
              className="h-11 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Filtrar
            </button>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 text-sm">
              <span className="text-slate-600">
                {isLoading ? "Cargando..." : `${items.length} ventas visibles`}
              </span>
              {error && <span className="text-rose-700">{error}</span>}
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Empresa</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Referencia</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No hay ventas para estos filtros.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-5 py-3">{formatDate(item.transaction_date)}</td>
                        <td className="px-5 py-3">{item.company.name}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-900">
                            {item.customer?.name ?? "Cliente genérico"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.customer?.phone ?? "Sin teléfono"}
                          </div>
                        </td>
                        <td className="px-5 py-3">{item.document_number ?? "-"}</td>
                        <td className="px-5 py-3 text-right font-semibold">
                          {COP_FORMATTER.format(Number(item.total_amount || "0"))}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold">
                            {formatStatus(item.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Detalle</h2>
            {!selectedId && (
              <p className="mt-3 text-sm text-slate-600">
                Selecciona una venta para ver el detalle completo.
              </p>
            )}
            {isDetailLoading && (
              <p className="mt-3 text-sm text-slate-600">Cargando detalle...</p>
            )}
            {!isDetailLoading && detail && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Empresa
                    </p>
                    <p className="font-semibold text-slate-900">{detail.company.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cliente
                    </p>
                    <p className="font-semibold text-slate-900">
                      {detail.customer?.name ?? "Cliente genérico"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {detail.customer?.phone ?? "Sin teléfono"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fecha
                    </p>
                    <p className="font-semibold text-slate-900">
                      {formatDate(detail.transaction_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Referencia
                    </p>
                    <p className="font-semibold text-slate-900">
                      {detail.document_number ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {COP_FORMATTER.format(Number(detail.total_amount || "0"))}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Descripción
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {detail.description}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pagos
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {detail.payments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {payment.payment_method_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {payment.payment_method_id}
                          </p>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {COP_FORMATTER.format(Number(payment.amount || "0"))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
