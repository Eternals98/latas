"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCsrfHeaders } from "../../lib/csrf-client";

type Company = { id: string; name: string };
type PaymentMethod = { id: string; name: string; affects_cash: boolean };
type Customer = { id: string; name: string; phone: string | null };
type PaymentRow = { row_id: string; payment_method_id: string; amount: string };
type CashSessionStatus = {
  id: string;
  session_date: string;
  status: string;
  opening_cash: string;
  closing_cash_expected: string | null;
  closing_cash_counted: string | null;
  difference_amount: string | null;
  cash_balance: string;
  vault_balance: string;
  total_operational_balance: string;
};

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
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createPaymentRow(index: number): PaymentRow {
  return {
    row_id: `payment-${Date.now()}-${index}`,
    payment_method_id: "",
    amount: "",
  };
}

export default function RegistroPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>(
    [],
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [companyId, setCompanyId] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayISO());
  const [documentNumber, setDocumentNumber] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow(0)]);
  const [focusedMoneyField, setFocusedMoneyField] = useState<
    "total" | string | null
  >(null);

  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [isLoadingCashStatus, setIsLoadingCashStatus] = useState(false);
  const [cashSessionStatus, setCashSessionStatus] = useState<CashSessionStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadCatalogs() {
      setIsLoadingCatalogs(true);
      try {
        const [companiesRes, methodsRes] = await Promise.all([
          fetch("/api/bff/companies", { cache: "no-store" }),
          fetch("/api/bff/payment-methods", { cache: "no-store" }),
        ]);
        const [companiesBody, methodsBody] = await Promise.all([
          companiesRes.json(),
          methodsRes.json(),
        ]);
        if (!companiesRes.ok) {
          throw new Error(
            companiesBody.detail || "No fue posible cargar empresas.",
          );
        }
        if (!methodsRes.ok) {
          throw new Error(
            methodsBody.detail || "No fue posible cargar métodos de pago.",
          );
        }
        setCompanies(companiesBody as Company[]);
        setPaymentMethods(methodsBody as PaymentMethod[]);
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Error cargando catálogos.",
        });
      } finally {
        setIsLoadingCatalogs(false);
      }
    }
    loadCatalogs();
  }, []);

  useEffect(() => {
    async function loadCashStatus() {
      setIsLoadingCashStatus(true);
      try {
        const response = await fetch(
          `/api/bff/cash/today?session_date=${encodeURIComponent(transactionDate.slice(0, 10))}`,
          { cache: "no-store" },
        );
        const body = await response.json();
        if (!response.ok) {
          if (response.status === 404) {
            setCashSessionStatus(null);
            return;
          }
          throw new Error(body.detail || "No fue posible consultar la caja.");
        }
        setCashSessionStatus((body as { session: CashSessionStatus }).session);
      } catch (error) {
        setCashSessionStatus(null);
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "No fue posible consultar la caja.",
        });
      } finally {
        setIsLoadingCashStatus(false);
      }
    }
    loadCashStatus();
  }, [transactionDate]);

  useEffect(() => {
    const nameQuery = customerSearch.trim();
    const phoneQuery = customerPhone.trim();
    const query = phoneQuery.length >= 3 ? phoneQuery : nameQuery;
    if (
      query.length < 2 ||
      (selectedCustomer && selectedCustomer.name === customerSearch)
    ) {
      setCustomerSuggestions([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/bff/customers?search=${encodeURIComponent(query)}`,
          { cache: "no-store" },
        );
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

  const totalAmountValue = useMemo(
    () => parseMoney(totalAmount),
    [totalAmount],
  );
  const isBalanced =
    totalAmountValue > 0 && Math.abs(paymentTotal - totalAmountValue) < 0.001;
  const hasValidPayments = payments.some(
    (row) => row.payment_method_id && parseMoney(row.amount) > 0,
  );
  const differenceAmount = paymentTotal - totalAmountValue;
  const isDifferenceZero = Math.abs(differenceAmount) < 0.001;
  const isCashOpen = cashSessionStatus?.status === "open";
  const canSubmit =
    !isSubmitting &&
    isCashOpen &&
    companyId &&
    transactionDate &&
    description.trim().length > 0 &&
    totalAmountValue > 0 &&
    hasValidPayments &&
    isBalanced;

  function updatePayment(rowId: string, changes: Partial<PaymentRow>) {
    setPayments((prev) =>
      prev.map((row) => (row.row_id === rowId ? { ...row, ...changes } : row)),
    );
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
      setMessage({
        type: "error",
        text: !isCashOpen
          ? "No se puede registrar la venta porque la caja está cerrada."
          : "Completa campos obligatorios y corrige el descuadre de pagos.",
      });
      return;
    }

    const payload: SalePayload = {
      company_id: companyId,
      transaction_date: new Date(transactionDate).toISOString(),
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
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
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
        text:
          error instanceof Error
            ? error.message
            : "No fue posible registrar la venta.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="h-[calc(100vh-56px)] overflow-hidden bg-[#f8fafc] px-4 py-4 text-gray-900">
      <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col overflow-hidden">
        <h1 className="mb-3 text-2xl font-bold leading-8 text-gray-900">
          Registro de Ventas
        </h1>

        {message && (
          <div
            className={`mb-3 rounded border px-3 py-2 text-xs ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px] gap-4 overflow-hidden">
          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-col gap-4 overflow-hidden"
          >
            {/* DATOS DE LA VENTA */}
            <section className="rounded border border-[#cbd5e1] bg-white p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {/* ENTIDAD DEL CLIENTE */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Cliente
                  </span>

                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-2 top-[7px] text-[16px] text-gray-500">
                      person_search
                    </span>

                    <input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (
                          selectedCustomer &&
                          selectedCustomer.name !== e.target.value
                        ) {
                          setSelectedCustomer(null);
                        }
                      }}
                      placeholder="Acme Corporation Ltd."
                      className="h-8 w-full rounded border border-[#cbd5e1] bg-white pl-8 pr-20 text-xs font-normal text-gray-900 outline-none focus:border-[#003D9B]"
                    />

                    {selectedCustomer && (
                      <span className="absolute right-2 top-[5px] rounded border border-[#cbd5e1] bg-slate-50 px-1.5 py-0.5 text-[10px] leading-4 text-gray-700">
                        ID: {selectedCustomer.id.slice(0, 6)}
                      </span>
                    )}

                    {customerSuggestions.length > 0 && (
                      <ul className="absolute left-0 top-9 z-20 max-h-40 w-full overflow-auto rounded border border-[#cbd5e1] bg-white shadow">
                        {customerSuggestions.map((customer) => (
                          <li
                            key={customer.id}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearch(customer.name);
                                setCustomerPhone(
                                  customer.phone
                                    ?.replace(/[^\d]/g, "")
                                    .slice(0, 10) ?? "",
                                );
                                setCustomerSuggestions([]);
                              }}
                              className="flex w-full justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                            >
                              <span className="font-medium text-gray-900">
                                {customer.name}
                              </span>
                              <span className="text-gray-500">
                                {customer.phone || "Sin teléfono"}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>

                {/* TELÉFONO */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Teléfono del cliente
                  </span>

                  <input
                    value={customerPhone}
                    onChange={(e) => {
                      const sanitized = e.target.value
                        .replace(/[^\d]/g, "")
                        .slice(0, 10);
                      setCustomerPhone(sanitized);
                    }}
                    placeholder="3001234567"
                    inputMode="numeric"
                    className="h-8 w-full rounded border border-[#cbd5e1] bg-white px-2 text-xs font-medium tracking-tight text-gray-900 outline-none focus:border-[#003D9B]"
                  />
                </label>

                {/* SUCURSAL / EMPRESA */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Empresa
                  </span>

                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="h-8 w-full rounded border border-[#cbd5e1] bg-white px-2 text-xs font-normal leading-4 text-gray-900 outline-none focus:border-[#003D9B]"
                  >
                    <option value="">Seleccione empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* FECHA */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Fecha y hora de registro
                  </span>

                  <input
                    type="datetime-local"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="h-8 w-full rounded border border-[#cbd5e1] bg-white px-2 text-xs font-medium tracking-tight text-gray-900 outline-none focus:border-[#003D9B]"
                  />
                </label>

                {/* REFERENCIA */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Referencia/Nota
                  </span>

                  <input
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="INV-2023-9942A"
                    className="h-8 w-full rounded border border-[#cbd5e1] bg-white px-2 text-xs font-medium tracking-tight text-gray-900 outline-none focus:border-[#003D9B]"
                  />
                </label>

                {/* VALOR DE LA VENTA */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Total venta
                  </span>

                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-2 top-[7px] text-[16px] text-gray-500">
                      payments
                    </span>

                    <input
                      value={
                        focusedMoneyField === "total"
                          ? totalAmount
                          : formatCop(totalAmount).replace("COP", "").trim()
                      }
                      onChange={(e) =>
                        setTotalAmount(sanitizeMoneyInput(e.target.value))
                      }
                      onFocus={() => setFocusedMoneyField("total")}
                      onBlur={() =>
                        setFocusedMoneyField((current) =>
                          current === "total" ? null : current,
                        )
                      }
                      placeholder="12,450.00"
                      inputMode="numeric"
                      className="h-8 w-full rounded border border-[#cbd5e1] bg-white pl-8 pr-3 text-xs font-medium tracking-tight text-gray-900 outline-none focus:border-[#003D9B]"
                    />
                  </div>
                </label>

                {/* NOTAS */}
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Notas internas / descripción
                  </span>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ingrese detalles de la transacción..."
                    rows={3}
                    className="min-h-[64px] w-full resize-none rounded border border-[#cbd5e1] bg-white px-2 py-1.5 text-xs font-normal leading-4 text-gray-900 outline-none placeholder:text-gray-500 focus:border-[#003D9B]"
                  />
                </label>
              </div>
            </section>

            {/* PAGOS */}
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-[#cbd5e1] bg-white">


              {/* HEADER PAGOS */}
              <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-slate-50 p-4">
                <h2 className="text-lg font-semibold leading-6 text-gray-900">
                  Asignación de Pago
                </h2>

                <button
                  type="button"
                  onClick={addPayment}
                  className="flex items-center gap-1 text-xs font-bold uppercase leading-4 tracking-wide text-gray-700"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    add
                  </span>
                  Añadir fila
                </button>
              </div>

              {/* TABLA HEADER */}
              <div className="grid grid-cols-[1fr_260px_32px] border-b border-gray-500 bg-indigo-50">
                <div className="p-2 text-xs font-semibold uppercase leading-4 tracking-wide text-gray-700">
                  Método
                </div>
                <div className="p-2 text-right text-xs font-semibold uppercase leading-4 tracking-wide text-gray-700">
                  Monto
                </div>
                <div />
              </div>

              {/* TABLA BODY */}
              <div className="min-h-0 flex-1 overflow-auto">
                {payments.map((row) => (
                  <div
                    key={row.row_id}
                    className="grid grid-cols-[1fr_260px_32px] items-center gap-2 border-b border-slate-200 bg-white py-2 pl-2 pr-0"
                  >
                    <select
                      value={row.payment_method_id}
                      onChange={(e) =>
                        updatePayment(row.row_id, {
                          payment_method_id: e.target.value,
                        })
                      }
                      className="h-8 w-full rounded border border-[#cbd5e1] bg-white px-2 text-xs font-normal leading-4 text-gray-900 outline-none focus:border-[#003D9B]"
                    >
                      <option value="">Seleccione método de pago</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>

                    <input
                      value={
                        focusedMoneyField === row.row_id
                          ? row.amount
                          : formatCop(row.amount).replace("COP", "").trim()
                      }
                      onChange={(e) =>
                        updatePayment(row.row_id, {
                          amount: sanitizeMoneyInput(e.target.value),
                        })
                      }
                      onFocus={() => setFocusedMoneyField(row.row_id)}
                      onBlur={() =>
                        setFocusedMoneyField((current) =>
                          current === row.row_id ? null : current,
                        )
                      }
                      placeholder="12,000.00"
                      inputMode="numeric"
                      className="h-8 w-full rounded border border-[#cbd5e1] bg-white px-2 text-right text-xs font-medium tracking-tight text-gray-900 outline-none focus:border-[#003D9B]"
                    />

                    <button
                      type="button"
                      onClick={() => removePayment(row.row_id)}
                      className="flex h-8 w-6 items-center justify-center text-gray-700 hover:text-red-700"
                      aria-label="Eliminar pago"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* FOOTER PAGOS */}
              <div className="flex justify-end border-t border-gray-500 bg-indigo-50 p-2 text-xs font-medium leading-4 tracking-tight text-gray-700">
                PAGADO:{" "}
                {formatCop(String(paymentTotal)).replace("COP", "").trim() ||
                  "0.00"}
              </div>
            </section>
          </form>

          {/* RESUMEN + ACCIONES */}
          <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">

            <div
                className={`border-b border-slate-200 p-4 text-xs ${
                  isCashOpen ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold uppercase tracking-wide">
                    Estado de caja
                  </span>
                  <span className="font-semibold">
                    {isLoadingCashStatus
                      ? "Consultando..."
                      : isCashOpen
                        ? "Abierta"
                        : "Cerrada"}
                  </span>
                </div>
                <p className="mt-1 leading-4">
                  {isCashOpen
                    ? `Caja abierta para ${transactionDate}.`
                    : `No se permite registrar ventas para ${transactionDate} porque la caja está cerrada o no existe apertura.`}
                </p>
              </div>
              
            <section className="overflow-hidden rounded border border-[#cbd5e1] bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)]">
              <div className="relative border-b border-slate-200 p-6">
                <div className="absolute left-0 top-0 h-full w-1 bg-slate-300" />
                <div className="pl-2">
                  <p className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Total venta
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-medium leading-5 text-gray-700">
                      $
                    </span>
                    <span className="text-3xl font-bold leading-9 text-gray-900">
                      {formatCop(String(totalAmountValue))
                        .replace("COP", "")
                        .trim() || "0"}
                    </span>
                  </div>
                </div>
              </div>

              

              <div className="relative border-b border-slate-200 p-6">
                <div className="absolute left-0 top-0 h-full w-1 bg-slate-200" />
                <div className="pl-2">
                  <p className="text-xs font-bold uppercase leading-4 tracking-wide text-gray-700">
                    Monto pagado
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-medium leading-5 text-gray-700">
                      $
                    </span>
                    <span className="text-3xl font-bold leading-9 text-gray-900">
                      {formatCop(String(paymentTotal))
                        .replace("COP", "")
                        .trim() || "0"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-6 ${
                  isDifferenceZero ? "bg-emerald-50" : "bg-rose-200/20"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${
                    isDifferenceZero ? "bg-emerald-600" : "bg-red-700"
                  }`}
                />

                <div className="pl-2">
                  <p
                    className={`text-xs font-bold uppercase leading-4 tracking-wide ${
                      isDifferenceZero ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    Diferencia
                  </p>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span
                      className={`text-sm font-medium leading-5 ${
                        isDifferenceZero ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {differenceAmount < 0 ? "-$" : "$"}
                    </span>

                    <span
                      className={`text-3xl font-bold leading-9 ${
                        isDifferenceZero ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {formatCop(String(Math.abs(differenceAmount)))
                        .replace("COP", "")
                        .trim() || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                form=""
                disabled={!canSubmit}
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.querySelector("form");
                  form?.requestSubmit();
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#003D9B] text-sm font-semibold leading-5 text-white opacity-70 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition hover:opacity-100 disabled:cursor-not-allowed disabled:bg-[#4C5D8D]"
              >
                <span className="material-symbols-outlined text-[16px]">
                  save
                </span>
                Registrar Venta
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex h-8 w-full items-center justify-center rounded border border-gray-500 text-xs font-medium leading-4 text-gray-900"
              >
                Cancelar y Limpiar
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
