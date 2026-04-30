"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Company = { id: string; name: string };
type PaymentMethod = { id: string; name: string; affects_cash: boolean };
type Customer = { id: string; name: string; phone: string | null };
type PaymentRow = { row_id: string; payment_method_id: string; amount: string };

type SalePayload = {
  company_id: string;
  transaction_date: string;
  document_number: string | null;
  description: string;
  total_amount: string;
  customer_id: string | null;
  payments: { payment_method_id: string; amount: string }[];
};

function parseMoney(value: string): number {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoneyString(value: string): string {
  return parseMoney(value).toFixed(2);
}

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function formatCop(value: string): string {
  const amount = parseMoney(value);
  if (amount === 0) {
    return "";
  }
  return COP_FORMATTER.format(amount);
}

function sanitizeMoneyInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createPaymentRow(index: number): PaymentRow {
  return { row_id: `payment-${Date.now()}-${index}`, payment_method_id: "", amount: "" };
}

export default function RegistroPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [companyId, setCompanyId] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [documentNumber, setDocumentNumber] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow(0)]);
  const [focusedMoneyField, setFocusedMoneyField] = useState<"total" | string | null>(null);

  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadCatalogs() {
      setIsLoadingCatalogs(true);
      try {
        const [companiesRes, methodsRes] = await Promise.all([
          fetch("/api/bff/companies", { cache: "no-store" }),
          fetch("/api/bff/payment-methods", { cache: "no-store" }),
        ]);
        const [companiesBody, methodsBody] = await Promise.all([companiesRes.json(), methodsRes.json()]);
        if (!companiesRes.ok) {
          throw new Error(companiesBody.detail || "No fue posible cargar empresas.");
        }
        if (!methodsRes.ok) {
          throw new Error(methodsBody.detail || "No fue posible cargar métodos de pago.");
        }
        setCompanies(companiesBody as Company[]);
        setPaymentMethods(methodsBody as PaymentMethod[]);
      } catch (error) {
        setMessage({ type: "error", text: error instanceof Error ? error.message : "Error cargando catálogos." });
      } finally {
        setIsLoadingCatalogs(false);
      }
    }
    loadCatalogs();
  }, []);

  useEffect(() => {
    const nameQuery = customerSearch.trim();
    const phoneQuery = customerPhone.trim();
    const query = phoneQuery.length >= 3 ? phoneQuery : nameQuery;
    if (query.length < 2 || (selectedCustomer && selectedCustomer.name === customerSearch)) {
      setCustomerSuggestions([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/bff/customers?search=${encodeURIComponent(query)}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.detail || "No fue posible buscar clientes.");
        }
        setCustomerSuggestions(body as Customer[]);
      } catch {
        setCustomerSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [customerSearch, customerPhone, selectedCustomer]);

  const paymentTotal = useMemo(
    () => payments.reduce((sum, row) => sum + parseMoney(row.amount), 0),
    [payments],
  );

  const totalAmountValue = useMemo(() => parseMoney(totalAmount), [totalAmount]);
  const isBalanced = totalAmountValue > 0 && Math.abs(paymentTotal - totalAmountValue) < 0.001;
  const hasValidPayments = payments.some((row) => row.payment_method_id && parseMoney(row.amount) > 0);
  const canSubmit =
    !isSubmitting &&
    companyId &&
    transactionDate &&
    description.trim().length > 0 &&
    totalAmountValue > 0 &&
    hasValidPayments &&
    isBalanced;

  function updatePayment(rowId: string, changes: Partial<PaymentRow>) {
    setPayments((prev) => prev.map((row) => (row.row_id === rowId ? { ...row, ...changes } : row)));
  }

  function addPayment() {
    setPayments((prev) => [...prev, createPaymentRow(prev.length)]);
  }

  function removePayment(rowId: string) {
    setPayments((prev) => {
      const next = prev.filter((row) => row.row_id !== rowId);
      return next.length > 0 ? next : [createPaymentRow(0)];
    });
  }

  function resetForm() {
    setCompanyId("");
    setTransactionDate(todayISO());
    setDocumentNumber("");
    setDescription("");
    setTotalAmount("");
    setPayments([createPaymentRow(0)]);
    setFocusedMoneyField(null);
    setCustomerSearch("");
    setCustomerPhone("");
    setSelectedCustomer(null);
    setCustomerSuggestions([]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage({ type: "error", text: "Completa campos obligatorios y corrige el descuadre de pagos." });
      return;
    }

    const payload: SalePayload = {
      company_id: companyId,
      transaction_date: transactionDate,
      document_number: documentNumber.trim() || null,
      description: description.trim(),
      total_amount: toMoneyString(totalAmount),
      customer_id: selectedCustomer?.id ?? null,
      payments: payments
        .filter((row) => row.payment_method_id && parseMoney(row.amount) > 0)
        .map((row) => ({
          payment_method_id: row.payment_method_id,
          amount: toMoneyString(row.amount),
        })),
    };

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/bff/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail || "No fue posible registrar la venta.");
      }
      setMessage({ type: "success", text: "Venta registrada correctamente." });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No fue posible registrar la venta.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-4xl bg-app-surface px-4 py-8 md:px-8">
      <div className="pointer-events-none fixed -right-20 -top-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -left-12 h-52 w-52 rounded-full bg-orange-200/30 blur-3xl" />

      <header className="mb-6">
        <h1 className="font-manrope text-3xl font-extrabold text-slate-900">Registro de Ventas</h1>
        <p className="mt-1 text-sm text-slate-600">Complete los detalles para registrar una nueva transacción.</p>
        <div className="mt-2 flex gap-2 text-xs">
          {isLoadingCatalogs && <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">Cargando catálogos...</span>}
          {isSubmitting && <span className="rounded bg-slate-200 px-2 py-1 text-slate-700">Guardando venta...</span>}
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Empresa</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Seleccione empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Fecha de Venta</span>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="relative flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Cliente (opcional)</span>
              <input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (selectedCustomer && selectedCustomer.name !== e.target.value) {
                    setSelectedCustomer(null);
                  }
                }}
                placeholder="Buscar por nombre o teléfono"
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {customerSuggestions.length > 0 && (
                <ul className="absolute top-[72px] z-20 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {customerSuggestions.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch(customer.name);
                          setCustomerPhone(customer.phone?.replace(/[^\d]/g, "").slice(0, 10) ?? "");
                          setCustomerSuggestions([]);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <span className="text-sm text-slate-800">{customer.name}</span>
                        <span className="text-xs text-slate-500">{customer.phone || "Sin teléfono"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Teléfono</span>
              <input
                value={customerPhone}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
                  setCustomerPhone(sanitized);
                }}
                onBlur={() => {
                  if (customerPhone.length > 0 && customerSearch.trim().length === 0) {
                    setCustomerSearch(customerPhone);
                  }
                }}
                placeholder="3001234567"
                inputMode="numeric"
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Número de Referencia</span>
              <input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="REF-00123"
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Valor Total</span>
              <input
                value={focusedMoneyField === "total" ? totalAmount : formatCop(totalAmount)}
                onChange={(e) => setTotalAmount(sanitizeMoneyInput(e.target.value))}
                onFocus={() => setFocusedMoneyField("total")}
                onBlur={() => setFocusedMoneyField((current) => (current === "total" ? null : current))}
                placeholder="COP 0"
                inputMode="numeric"
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <div className="md:col-span-2" />

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Descripción</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalles adicionales de la venta..."
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-manrope text-xl font-bold text-slate-900">Pagos</h2>
            <button
              type="button"
              onClick={addPayment}
              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Agregar pago
            </button>
          </div>

          <div className="space-y-3">
            {payments.map((row) => (
              <div key={row.row_id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_200px_44px]">
                <select
                  value={row.payment_method_id}
                  onChange={(e) => updatePayment(row.row_id, { payment_method_id: e.target.value })}
                  className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Seleccione método de pago</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                <input
                  value={focusedMoneyField === row.row_id ? row.amount : formatCop(row.amount)}
                  onChange={(e) => updatePayment(row.row_id, { amount: sanitizeMoneyInput(e.target.value) })}
                  onFocus={() => setFocusedMoneyField(row.row_id)}
                  onBlur={() => setFocusedMoneyField((current) => (current === row.row_id ? null : current))}
                  placeholder="COP 0"
                  inputMode="numeric"
                  className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => removePayment(row.row_id)}
                  className="h-11 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Total venta</span>
              <span>{COP_FORMATTER.format(totalAmountValue)}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Total pagos</span>
              <span>{COP_FORMATTER.format(paymentTotal)}</span>
            </div>
            <div className={`mt-2 flex justify-between font-semibold ${isBalanced ? "text-emerald-700" : "text-rose-700"}`}>
              <span>Diferencia</span>
              <span>{COP_FORMATTER.format(paymentTotal - totalAmountValue)}</span>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="h-11 rounded-lg border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 rounded-lg bg-blue-600 px-5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Guardando..." : "Registrar Venta"}
          </button>
        </div>
      </form>
    </main>
  );
}
