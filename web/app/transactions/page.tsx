"use client";

import { useEffect, useMemo, useState } from "react";
import { MultiSelectCombobox } from "../../components/combobox-multiselect";

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

type Company = { id: string; name: string };
type PaymentMethod = { id: string; name: string };

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const PAYMENT_METHOD_STYLES = [
  "bg-sky-100 text-sky-700 ring-sky-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-violet-100 text-violet-700 ring-violet-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-cyan-100 text-cyan-700 ring-cyan-200",
] as const;

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

function truncateDescription(description: string): string {
  return description.replace(/\s+/g, " ").trim();
}

function paymentMethodClass(name: string): string {
  const normalized = name.trim().toLowerCase();
  const knownStyles: Record<string, string> = {
    efectivo: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    cash: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    tarjeta: "bg-sky-100 text-sky-700 ring-sky-200",
    debito: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    débito: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    credito: "bg-violet-100 text-violet-700 ring-violet-200",
    crédito: "bg-violet-100 text-violet-700 ring-violet-200",
    transfer: "bg-amber-100 text-amber-700 ring-amber-200",
    transferencia: "bg-amber-100 text-amber-700 ring-amber-200",
    nequi: "bg-cyan-100 text-cyan-700 ring-cyan-200",
    daviplata: "bg-rose-100 text-rose-700 ring-rose-200",
    "banco": "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return knownStyles[normalized] ?? PAYMENT_METHOD_STYLES[normalized.length % PAYMENT_METHOD_STYLES.length];
}

export default function TransactionsPage() {
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [paymentMethodIds, setPaymentMethodIds] = useState<string[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SaleItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  async function loadLookupData() {
    const [companyResponse, paymentMethodResponse] = await Promise.all([
      fetch("/api/bff/companies", { cache: "no-store" }),
      fetch("/api/bff/payment-methods", { cache: "no-store" }),
    ]);
    const [companyBody, paymentMethodBody] = await Promise.all([
      companyResponse.json(),
      paymentMethodResponse.json(),
    ]);
    if (companyResponse.ok) setCompanies(companyBody as Company[]);
    if (paymentMethodResponse.ok) setPaymentMethods(paymentMethodBody as PaymentMethod[]);
  }

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
      if (search.trim()) params.set("search", search.trim());
      companyIds.forEach((id) => params.append("company_ids", id));
      paymentMethodIds.forEach((id) => params.append("payment_method_ids", id));

      const response = await fetch(`/api/bff/sales?${params.toString()}`, { cache: "no-store" });
      const body = (await response.json()) as SaleListResponse | { detail?: string };
      if (!response.ok) {
        const detailText = "detail" in body ? body.detail : undefined;
        throw new Error(detailText || "No fue posible cargar transacciones.");
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
    loadLookupData().catch(() => undefined);
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadSales();
    }, 250);

    return () => window.clearTimeout(handle);
  }, [dateFrom, dateTo, search, companyIds, paymentMethodIds]);

  useEffect(() => {
    if (!selectedSaleId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setIsDetailLoading(true);
    fetch(`/api/bff/sales/${selectedSaleId}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as SaleItem | { detail?: string };
        if (!response.ok) {
          const detailText = "detail" in body ? body.detail : undefined;
          throw new Error(detailText || "No fue posible cargar detalle.");
        }
        if (!cancelled) setDetail(body as SaleItem);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No fue posible cargar detalle.");
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSaleId]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.total_amount || "0"), 0),
    [items],
  );

  function toggleSelectedValue(
    values: string[],
    setter: (next: string[]) => void,
    value: string,
  ) {
    setter(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#f4f6fb] px-3 py-3 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1160px] flex-col gap-2">
        <section className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <h1 className="text-[24px] font-semibold leading-none tracking-tight text-slate-900">
              Transacciones
            </h1>
            <div className="flex gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">
                {total} registros
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">
                {COP_FORMATTER.format(totalAmount)}
              </span>
            </div>
          </div>

          <div className="pt-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[156px_156px_1fr_auto]">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-400"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por referencia, cliente o teléfono"
                className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr]">
              <MultiSelectCombobox
                label="Empresas"
                options={companies}
                selectedIds={companyIds}
                onChange={setCompanyIds}
                placeholder="Todas las empresas"
              />
              <MultiSelectCombobox
                label="Métodos de pago"
                options={paymentMethods}
                selectedIds={paymentMethodIds}
                onChange={setPaymentMethodIds}
                placeholder="Todos los métodos"
                chipClassName="border-slate-300 bg-slate-100 text-slate-700"
                
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">
                {isLoading ? "Cargando..." : `${items.length} transacciones visibles`}
              </span>
              {error && <span className="text-rose-700">{error}</span>}
            </div>
            <div className="mt-2 flex gap-2 text-xs font-semibold text-slate-700">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Total listado: {COP_FORMATTER.format(totalAmount)}
              </span>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Método de pago</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No hay transacciones para estos filtros.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  items.map((item) => {
                    const paymentLabel =
                      item.payments.length === 0
                        ? "-"
                        : item.payments.length === 1
                          ? item.payments[0]?.payment_method_name
                          : "MULTIPLES";
                    const paymentStyle =
                      item.payments.length === 1
                        ? paymentMethodClass(item.payments[0]?.payment_method_name ?? "")
                        : "bg-slate-100 text-slate-700 ring-slate-200";

                    return (
                      <tr
                        key={item.id}
                        onDoubleClick={() => setSelectedSaleId(item.id)}
                        className="cursor-default border-t border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3">{formatDate(item.transaction_date)}</td>
                        <td className="px-4 py-3">{item.company.name}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {item.customer?.name ?? "Cliente genérico"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.customer?.phone ?? "Sin teléfono"}
                          </div>
                        </td>
                        <td className="px-4 py-3">{item.document_number ?? "-"}</td>
                        <td className="px-4 py-3">
                          <div
                            title={item.description}
                            className="overflow-hidden text-ellipsis capitalize"
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                            }}
                          >
                            {truncateDescription(item.description)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${paymentStyle} uppercase`}
                          >
                            {paymentLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {COP_FORMATTER.format(Number(item.total_amount || "0"))}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Detalle de transacción
                </p>
                <h2 className="text-lg font-black text-slate-900">
                  {detail?.document_number ?? "Sin referencia"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleId(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[calc(92vh-72px)] overflow-auto p-5">
              {isDetailLoading && <p className="text-sm text-slate-600">Cargando detalle...</p>}
              {!isDetailLoading && detail && (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total
                      </p>
                      <p className="mt-1 text-3xl font-black text-slate-900">
                        {COP_FORMATTER.format(Number(detail.total_amount || "0"))}
                      </p>
                    </div>
                    <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm">
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
                          Descripción
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-700">
                          {detail.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Métodos de pago
                      </div>
                      <div className="divide-y divide-slate-100">
                        {detail.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between px-4 py-3 text-sm">
                            <div>
                              <p
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${paymentMethodClass(
                                  payment.payment_method_name,
                                )}`}
                              >
                                {payment.payment_method_name}
                              </p>
                              <p className="text-xs text-slate-500">{payment.payment_method_id}</p>
                            </div>
                            <span className="font-semibold text-slate-900">
                              {COP_FORMATTER.format(Number(payment.amount || "0"))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
