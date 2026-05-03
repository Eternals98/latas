"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCsrfHeaders } from "../../lib/csrf-client";

type CashSessionResponse = {
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
  opened_by: string | null;
  closed_by: string | null;
  opened_by_label?: string | null;
  closed_by_label?: string | null;
  opened_at: string;
  closed_at: string | null;
};

type CashMovementItem = {
  id: string;
  transaction_id: string | null;
  movement_date: string;
  movement_type: string;
  amount: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

type CashTodayResponse = {
  session: CashSessionResponse;
  movements: CashMovementItem[];
};

type CashEventItem = {
  id: string;
  cash_session_id: string;
  event_type: string;
  event_label: string;
  actor_id: string;
  actor_label: string | null;
  event_at: string;
  payload: Record<string, unknown> | null;
  note: string | null;
};

type CashEventHistoryResponse = {
  items: CashEventItem[];
  total: number;
};

type SalePayment = {
  payment_method_id: string;
  payment_method_name: string;
  amount: string;
};

type SaleSummaryItem = {
  id: string;
  description: string;
  document_number: string | null;
  total_amount: string;
  status: string;
  created_at: string;
  payments: SalePayment[];
};

type SalesListResponse = {
  items: SaleSummaryItem[];
  total: number;
  limit: number;
  offset: number;
};

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function money(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function numericInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function formatNumericInput(value: string): string {
  const digits = numericInput(value);
  if (!digits) return "";
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Number(digits));
}

function parseNumericInput(value: string): number {
  const digits = numericInput(value);
  return digits ? Number(digits) : 0;
}

async function parseResponseBody(response: Response): Promise<{ detail?: string } | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as { detail?: string };
  } catch {
    return { detail: text };
  }
}

function prettyType(value: string): string {
  const map: Record<string, string> = {
    open: "APERTURA",
    close: "CIERRE",
    cash_in: "VENTA",
    cash_out: "SALIDA",
    vault_in: "BÓVEDA",
    vault_out: "BÓVEDA",
    adjustment_in: "AJUSTE +",
    adjustment_out: "AJUSTE -",
  };
  return map[value] ?? value.toUpperCase();
}

function typeMeta(value: string) {
  const map: Record<string, { label: string; icon: string; className: string }> = {
    APERTURA: {
      label: "APERTURA",
      icon: "lock_open",
      className: "bg-slate-900 text-white border-slate-900",
    },
    VENTA: {
      label: "VENTA",
      icon: "payments",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    SALIDA: {
      label: "RETIRO",
      icon: "account_balance",
      className: "bg-blue-50 text-blue-700 border-blue-100",
    },
    BÓVEDA: {
      label: "BÓVEDA",
      icon: "account_balance",
      className: "bg-blue-50 text-blue-700 border-blue-100",
    },
    CIERRE: {
      label: "CIERRE",
      icon: "lock",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
  };

  return (
    map[value] ?? {
      label: value,
      icon: "receipt_long",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
}

export default function CashManagementPage() {
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [session, setSession] = useState<CashSessionResponse | null>(null);
  const [movements, setMovements] = useState<CashMovementItem[]>([]);
  const [sales, setSales] = useState<SaleSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeAction, setActiveAction] = useState<"open" | "delivery" | "close" | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [openingCash, setOpeningCash] = useState(formatNumericInput("0"));
  const [movementAmount, setMovementAmount] = useState(formatNumericInput("0"));
  const [movementDescription, setMovementDescription] = useState("");
  const [closingCash, setClosingCash] = useState(formatNumericInput("0"));
  const [closeStep, setCloseStep] = useState<1 | 2>(1);
  const [closeNeedsDelivery, setCloseNeedsDelivery] = useState(false);
  const [closeDeliveryAmount, setCloseDeliveryAmount] = useState(formatNumericInput("0"));
  const [closeDeliveryDescription, setCloseDeliveryDescription] = useState("Última entrega a bóveda");
  const [closeMatchesCash, setCloseMatchesCash] = useState(true);
  const [closeExpectedCash, setCloseExpectedCash] = useState<number | null>(null);
  const [closeExpectedBeforeDelivery, setCloseExpectedBeforeDelivery] = useState<number | null>(null);
  const [closeDeliveryApplied, setCloseDeliveryApplied] = useState<number>(0);
  const [historyItems, setHistoryItems] = useState<CashEventItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [movementPageSize, setMovementPageSize] = useState<5 | 10 | 20 | "all">(5);
  const [movementPage, setMovementPage] = useState(1);
  const [movementSearch, setMovementSearch] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadCash() {
    setLoading(true);
    try {
      const [cashRes, salesRes] = await Promise.all([
        fetch(`/api/bff/cash/today?session_date=${encodeURIComponent(sessionDate)}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/bff/sales?date_from=${encodeURIComponent(sessionDate)}&date_to=${encodeURIComponent(sessionDate)}&limit=200&offset=0`,
          { cache: "no-store" },
        ),
      ]);

      const [cashBody, salesBody] = await Promise.all([cashRes.json(), salesRes.json()]);
      if (!cashRes.ok) {
        if (cashRes.status === 404) {
          setSession(null);
          setMovements([]);
          setSales([]);
          return;
        }
        throw new Error(cashBody.detail || "No fue posible cargar la caja.");
      }
      if (!salesRes.ok) {
        throw new Error(salesBody.detail || "No fue posible cargar las ventas del día.");
      }
      const cashData = cashBody as CashTodayResponse;
      const salesData = salesBody as SalesListResponse;
      setSession(cashData.session);
      setMovements(cashData.movements);
      setSales(salesData.items);
      setOpeningCash(cashData.session.opening_cash);
      setClosingCash(cashData.session.closing_cash_counted ?? cashData.session.cash_balance);
      setCloseExpectedCash(Number(cashData.session.cash_balance ?? 0));
      return cashData.session;
    } catch (error) {
      setToast({
        type: "error",
        text: error instanceof Error ? error.message : "No fue posible cargar la caja.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCash();
  }, [sessionDate]);

  const isOpen = session?.status === "open";
  const openedByLabel = session?.opened_by_label ?? session?.opened_by ?? "Pendiente";
  const closingDifference = session?.difference_amount ? Number(session.difference_amount) : null;

  const paymentSummary = useMemo(() => {
    const totals = new Map<string, number>();
    for (const sale of sales) {
      for (const payment of sale.payments) {
        if (payment.payment_method_name === "EFECTIVO") continue;
        const current = totals.get(payment.payment_method_name) ?? 0;
        totals.set(payment.payment_method_name, current + Number(payment.amount));
      }
    }
    return Array.from(totals.entries())
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [sales]);

  const metrics = useMemo(() => {
    const opening = Number(session?.opening_cash ?? 0);
    const cashIn = movements.reduce((sum, m) => {
      if (m.movement_type === "cash_in") return sum + Number(m.amount);
      if (m.movement_type === "cash_out") return sum - Number(m.amount);
      return sum;
    }, 0);
    const cashOut = movements.filter((m) => m.movement_type === "cash_out").reduce((sum, m) => sum + Number(m.amount), 0);
    const vaultIn = movements.filter((m) => m.movement_type === "vault_in").reduce((sum, m) => sum + Number(m.amount), 0);
    return {
      opening,
      cashIn: cashIn + opening,
      cashOut,
      vaultIn,
      cashBalance: Number(session?.cash_balance ?? 0),
      vaultBalance: Number(session?.vault_balance ?? 0),
      totalBalance: 
                      + Number(session?.cash_balance ?? 0) 
                      + Number(session?.vault_balance ?? 0) 
                      + paymentSummary.reduce((sum, item) => sum + item.amount, 0),
    };
  }, [movements, session]);

  

  const cashMethodRows = useMemo(() => {
    return sales.map((sale) => {
      const cash = sale.payments
        .filter((payment) => payment.payment_method_name === "EFECTIVO")
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      const sign = sale.status?.toLowerCase() === "cancelled" ? -1 : 1;
      const other = sale.payments
        .filter((payment) => payment.payment_method_name !== "EFECTIVO")
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      return {
        id: sale.id,
        dateLabel: sale.created_at,
        type: "VENTA",
        description: sale.description,
        reference: sale.document_number ?? sale.id.slice(0, 8),
        status: sale.status,
        cashAmount: cash * sign,
        otherAmount: other,
        vaultAmount: 0,
      };
    });
  }, [sales, sessionDate]);

  const operationalRows = useMemo(() => {
    return movements
      .filter(
        (movement) =>
          ((movement.movement_type !== "cash_in" || movement.transaction_id === null) && movement.movement_type !== "cash_out"),
      )
      .map((movement) => ({
      id: movement.id,
      dateLabel: movement.created_at,
      type: prettyType(movement.movement_type),
      description: movement.description ?? "-",
      reference: movement.transaction_id ? movement.transaction_id.slice(0, 8) : "N/A",
      status: movement.movement_type === "cash_out" ? "cancelled" : "",
      cashAmount:
        movement.movement_type === "cash_in"
          ? Number(movement.amount)
          : movement.movement_type === "cash_out"
            ? -Number(movement.amount)
            : movement.movement_type === "vault_in"
              ? -Number(movement.amount)
              : movement.movement_type === "vault_out"
                ? Number(movement.amount)
                : 0,
      otherAmount: 0,
      vaultAmount:
        movement.movement_type === "vault_in"
          ? Number(movement.amount)
          : movement.movement_type === "vault_out"
            ? -Number(movement.amount)
            : 0,
      }));
  }, [movements]);

  const movementRows = useMemo(() => {
    const openingRow =
      session && session.opened_at
        ? [
            {
              id: `opening-${session.id}`,
              dateLabel: session.opened_at,
              type: "APERTURA",
              description: "Apertura de caja",
              reference: "N/A",
              cashAmount: Number(session.opening_cash ?? 0),
              otherAmount: 0,
              vaultAmount: 0,
            },
          ]
        : [];
    const combined = [...openingRow, ...cashMethodRows, ...operationalRows];
    return combined.sort((a, b) => String(a.dateLabel).localeCompare(String(b.dateLabel)));
  }, [cashMethodRows, operationalRows, session]);

  const movementPagination = useMemo(() => {
    const query = movementSearch.trim().toLowerCase();
    const filteredRows = query
      ? movementRows.filter((row) => {
          const text = [
            row.type,
            row.description,
            row.reference,
            new Date(String(row.dateLabel)).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            money(row.cashAmount),
            money(row.otherAmount),
            money(row.vaultAmount),
          ]
            .join(" ")
            .toLowerCase();
          return text.includes(query);
        })
      : movementRows;
    const total = filteredRows.length;
    const pageSize = movementPageSize === "all" ? total || 1 : movementPageSize;
    const totalPages = movementPageSize === "all" ? 1 : Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(movementPage, 1), totalPages);
    const start = movementPageSize === "all" ? 0 : (safePage - 1) * pageSize;
    const end = movementPageSize === "all" ? total : start + pageSize;
    return {
      total,
      pageSize,
      totalPages,
      currentPage: safePage,
      visibleRows: filteredRows.slice(start, end),
    };
  }, [movementRows, movementPage, movementPageSize, movementSearch]);

  useEffect(() => {
    setMovementPage(1);
  }, [sessionDate, movementPageSize]);

  useEffect(() => {
    setMovementPage(1);
  }, [movementSearch]);

  useEffect(() => {
    if (movementPage > movementPagination.totalPages) {
      setMovementPage(movementPagination.totalPages);
    }
  }, [movementPage, movementPagination.totalPages]);

  const closeExpectedAfterDelivery = useMemo(() => {
    const baseExpected = closeExpectedBeforeDelivery ?? Number(session?.cash_balance ?? 0);
    const deliveryAmount = closeNeedsDelivery ? parseNumericInput(closeDeliveryAmount) : 0;
    return Math.max(0, baseExpected - deliveryAmount);
  }, [closeExpectedBeforeDelivery, closeDeliveryAmount, closeNeedsDelivery, session]);

  function closeActionModal() {
    setActiveAction(null);
    setMovementAmount(formatNumericInput("0"));
    setMovementDescription("");
    setOpeningCash(formatNumericInput(session?.opening_cash ?? "0"));
    setClosingCash(formatNumericInput(session?.closing_cash_counted ?? session?.cash_balance ?? "0"));
    setCloseStep(1);
    setCloseNeedsDelivery(false);
    setCloseDeliveryAmount(formatNumericInput("0"));
    setCloseDeliveryDescription("Última entrega a bóveda");
    setCloseMatchesCash(true);
    setCloseExpectedCash(Number(session?.cash_balance ?? 0));
    setCloseExpectedBeforeDelivery(null);
    setCloseDeliveryApplied(0);
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`/api/bff/cash/events?date_from=${encodeURIComponent(sessionDate)}&date_to=${encodeURIComponent(sessionDate)}`, {
        cache: "no-store",
      });
      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(body?.detail || "No fue posible cargar el historial de caja.");
      }
      const data = body as CashEventHistoryResponse;
      setHistoryItems(data.items);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "No fue posible cargar el historial de caja.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleCloseWizardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      if (closeStep === 1) {
        setCloseExpectedBeforeDelivery(Number(session?.cash_balance ?? 0));
        const refreshedSession = session ?? (await loadCash());
        const refreshedExpectedCash = Number(refreshedSession?.cash_balance ?? 0);
        setCloseExpectedCash(refreshedExpectedCash);
        setCloseStep(2);
        setCloseMatchesCash(true);
        setClosingCash(formatNumericInput(String(refreshedExpectedCash)));
        return;
      }

      const baseExpectedCash = Number(closeExpectedBeforeDelivery ?? session?.cash_balance ?? 0);
      const pendingDeliveryAmount = closeNeedsDelivery ? parseNumericInput(closeDeliveryAmount) : 0;
      const previewExpectedCash = baseExpectedCash - pendingDeliveryAmount;
      if (closeNeedsDelivery && closeDeliveryApplied === 0) {
        const amount = parseNumericInput(closeDeliveryAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Ingresa un monto válido para la última entrega a bóveda.");
        }
        if (amount > baseExpectedCash) {
          throw new Error(`La entrega no puede ser mayor al efectivo en caja (${money(baseExpectedCash)}).`);
        }
        const deliveryResponse = await fetch("/api/bff/cash/delivery", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({
            movement_date: sessionDate,
            amount,
            description: closeDeliveryDescription || "Última entrega a bóveda",
          }),
        });
        const deliveryBody = await parseResponseBody(deliveryResponse);
        if (!deliveryResponse.ok) {
          throw new Error(deliveryBody?.detail || "No fue posible registrar la entrega a bóveda.");
        }
        setCloseDeliveryApplied(amount);
        setToast({ type: "success", text: "Última entrega a bóveda registrada." });
        const refreshedSession = await loadCash();
        const refreshedExpectedCash = Number(refreshedSession?.cash_balance ?? 0);
        setCloseExpectedCash(refreshedExpectedCash);
      }

      const counted = closeMatchesCash ? previewExpectedCash : parseNumericInput(closingCash);
      if (!Number.isFinite(counted) || counted < 0) {
        throw new Error("Ingresa un valor válido para el efectivo contado.");
      }
      const response = await fetch("/api/bff/cash/close", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({ session_date: sessionDate, counted_cash: counted }),
      });
      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(body?.detail || "No fue posible cerrar la caja.");
      }
      const responseData = body as { difference_amount?: string | number | null } | null;
      const difference = Number(responseData?.difference_amount ?? 0);
      setToast({
        type: "success",
        text: difference === 0 ? "Caja cerrada" : "Caja cerrada - diferencia cerrada",
      });
      closeActionModal();
      await loadCash();
    } catch (error) {
      setToast({
        type: "error",
        text: error instanceof Error ? error.message : "No fue posible cerrar la caja.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitAction(event: FormEvent<HTMLFormElement>, action: "open" | "delivery" | "close") {
    event.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      let endpoint = "";
      let payload: Record<string, unknown> = {};
      if (action === "open") {
        endpoint = "/api/bff/cash/open";
        payload = { session_date: sessionDate, opening_cash: parseNumericInput(openingCash) };
      }
      if (action === "delivery") {
        const requestedAmount = parseNumericInput(movementAmount);
        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
          throw new Error("Ingresa un monto válido para la entrega a bóveda.");
        }
        if (requestedAmount > metrics.cashBalance) {
          throw new Error(`La entrega no puede ser mayor al efectivo en caja (${money(metrics.cashBalance)}).`);
        }
        endpoint = "/api/bff/cash/delivery";
        payload = { movement_date: sessionDate, amount: requestedAmount, description: movementDescription || "Entrega de efectivo" };
      }
      if (action === "close") {
        endpoint = "/api/bff/cash/close";
        payload = { session_date: sessionDate, counted_cash: parseNumericInput(closingCash) };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify(payload),
      });
      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(body?.detail || "No fue posible ejecutar la acción.");
      }
      setToast({ type: "success", text: "Operación registrada correctamente." });
      closeActionModal();
      await loadCash();
    } catch (error) {
      setToast({
        type: "error",
        text: error instanceof Error ? error.message : "No fue posible ejecutar la acción.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenCashClick() {
    if (isOpen) {
      return;
    }
    if (session) {
      setLoading(true);
      setToast(null);
      try {
        const response = await fetch("/api/bff/cash/open", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({
            session_date: sessionDate,
            opening_cash: Number(session.opening_cash ?? 0),
          }),
        });
        const body = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(body?.detail || "No fue posible reabrir la caja.");
        }
        setToast({ type: "success", text: "Caja reabierta correctamente." });
        closeActionModal();
        await loadCash();
        return;
      } catch (error) {
        setToast({
          type: "error",
          text: error instanceof Error ? error.message : "No fue posible reabrir la caja.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    setOpeningCash(formatNumericInput("0"));
    setActiveAction("open");
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-0 text-slate-900">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(100vw-2rem,24rem)] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
          <div className={`flex items-start gap-3 ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
            <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            <p className="text-sm font-medium">{toast.text}</p>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold leading-9 text-[#003D9B]">Caja Diaria</h1>
            <label className="mt-3 flex items-center gap-3 text-sm text-slate-900">
              <span className="material-symbols-outlined text-[18px] text-[#003D9B]">calendar_month</span>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                void handleOpenCashClick();
              }}
              className="h-10 rounded bg-[#003D9B] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isOpen}
            >
              Abrir Caja
            </button>
            <button
              onClick={() => setActiveAction("delivery")}
              className="h-10 rounded border border-slate-400 px-4 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isOpen}
            >
              Entrega a Bóveda
            </button>
            <button
              onClick={() => setActiveAction("close")}
              className="h-10 rounded border border-red-700 px-4 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isOpen}
            >
              Cerrar Caja
            </button>
            <button
              onClick={() => {
                setShowHistoryModal(true);
                void loadHistory();
              }}
              className="h-10 rounded border border-slate-400 px-4 text-sm font-medium text-slate-900"
            >
              Historial caja
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <div className="rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Estado</p>
            <div className="mt-3 flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
              <div>
                <div className="text-4xl font-bold leading-none text-[#003D9B]">CAJA</div>
                <div className="text-4xl font-bold leading-none text-[#003D9B]">{isOpen ? "ABIERTA" : "CERRADA"}</div>
              </div>
            </div>
            {!isOpen && closingDifference !== null && (
              <div className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Diferencia de cierre</p>
                <p className={`mt-1 text-lg font-bold ${closingDifference < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {money(closingDifference)}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 rounded border border-slate-200 bg-white p-5 lg:grid-cols-2">
            <div className="border-r border-slate-200 pr-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Operador Responsable</p>
              <p className="pt-1 text-lg font-medium text-[#003D9B]">{openedByLabel}</p>
            </div>
            <div className="border-slate-200 pr-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Apertura</p>
              <p className="pt-1 text-lg font-medium text-[#003D9B]">{session ? new Date(session.opened_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "Pendiente"}</p>
              <p className="pt-4 text-xs font-bold uppercase tracking-wide text-slate-700">Cierre</p>
              <p className="pt-1 text-lg font-medium text-[#003D9B]">{session?.closed_at ? new Date(session.closed_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "Pendiente"}</p>
            </div>
          </div>
          <article className="flex flex-col justify-center rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Total Acumulado</p>
            <p className="pt-4 text-5xl font-bold text-[#003D9B]">{money(metrics.totalBalance)}</p>
            <p className="pt-4 text-base text-slate-600">Ingresos de todas las fuentes</p>
          </article>
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="rounded border border-slate-200 bg-white p-5 text-left transition hover:border-[#003D9B] hover:shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Metodos de pago No efectivos</p>
            <p className="mt-3 text-5xl font-bold text-[#003D9B]">
              {money(paymentSummary.reduce((sum, item) => sum + item.amount, 0))}
            </p>
            <p className="mt-3 text-base text-slate-600">Click para ver detalle</p>
          </button>
        </section>

        {activeAction === "open" && !session && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Movimiento</p>
                  <h3 className="text-2xl font-semibold text-[#003D9B]">Apertura de Caja</h3>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <form className="mt-4" onSubmit={(e) => submitAction(e, "open")}>
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Fondo de apertura</span>
                    <input
                      value={openingCash}
                      onChange={(e) => setOpeningCash(formatNumericInput(e.target.value))}
                      inputMode="numeric"
                      className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                    />
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="submit" className="rounded bg-[#003D9B] px-4 py-2 text-sm font-medium text-white" disabled={loading}>
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-900"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeAction === "close" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Cierre</p>
                  <h3 className="text-2xl font-semibold text-[#003D9B]">Cerrar Caja</h3>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Cerrar
                </button>
              </div>

              <form className="mt-4" onSubmit={handleCloseWizardSubmit}>
                <div className="grid gap-4 md:grid-cols-4">
                    {closeStep === 1 && (
                      <>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Entrega Final</span>
                      <select
                        value={closeNeedsDelivery ? "yes" : "no"}
                      onChange={(e) => {
                        const needsDelivery = e.target.value === "yes";
                        setCloseNeedsDelivery(needsDelivery);
                        if (needsDelivery) {
                          setClosingCash(formatNumericInput(String(closeExpectedAfterDelivery)));
                        } else {
                          setClosingCash(formatNumericInput(String(closeExpectedCash ?? closeExpectedAfterDelivery)));
                        }
                      }}
                        className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                      >
                        <option value="no">No</option>
                        <option value="yes">Sí</option>
                      </select>
                    </label>
                    {closeNeedsDelivery && (
                      <>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Monto entrega</span>
                          <input
                            value={closeDeliveryAmount}
                            onChange={(e) => {
                              const nextValue = formatNumericInput(e.target.value);
                              setCloseDeliveryAmount(nextValue);
                              if (closeNeedsDelivery) {
                                const baseExpected = closeExpectedBeforeDelivery ?? Number(session?.cash_balance ?? 0);
                                const nextExpected = Math.max(0, baseExpected - parseNumericInput(nextValue));
                                setClosingCash(formatNumericInput(String(nextExpected)));
                              }
                            }}
                            inputMode="numeric"
                            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                          />
                        </label>
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Descripción</span>
                          <input
                            value={closeDeliveryDescription}
                            onChange={(e) => setCloseDeliveryDescription(e.target.value)}
                            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                          />
                        </label>
                      </>
                    )}
                    <div className="md:col-span-4 rounded border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Efectivo esperado actual</p>
                      <p className="mt-2 text-3xl font-bold text-[#003D9B]">{money(closeExpectedBeforeDelivery ?? Number(session?.cash_balance ?? 0))}</p>
                    </div>
                  </>
                )}
                {closeStep === 2 && (
                  <>
                    <div className="md:col-span-2 rounded border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Esperado antes de entrega</p>
                      <p className="mt-2 text-2xl font-bold text-[#003D9B]">
                        {money(closeExpectedBeforeDelivery ?? Number(session?.cash_balance ?? 0))}
                      </p>
                    </div>
                    <div className="rounded border border-slate-200 bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Última entrega</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">- {money(closeNeedsDelivery ? parseNumericInput(closeDeliveryAmount) : 0)}</p>
                    </div>
                    <div className="md:col-span-4 rounded border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Efectivo esperado para cierre</p>
                      <p className="mt-2 text-4xl font-bold text-[#003D9B]">
                        {money(
                          Number(closeExpectedBeforeDelivery ?? Number(session?.cash_balance ?? 0)) -
                            (closeNeedsDelivery ? parseNumericInput(closeDeliveryAmount) : 0),
                        )}
                      </p>
                    </div>
                    {closeNeedsDelivery && (
                      <div className="md:col-span-4 rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                        <p className="text-xs font-bold uppercase tracking-wide">Entrega pendiente de confirmar</p>
                        <p className="mt-2 text-sm">
                          La entrega se registrará solo al confirmar el cierre.
                        </p>
                      </div>
                    )}
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-700">¿Coincide?</span>
                    <select
                      value={closeMatchesCash ? "yes" : "no"}
                      onChange={(e) => {
                        const matches = e.target.value === "yes";
                        setCloseMatchesCash(matches);
                        if (matches && closeExpectedCash !== null) {
                          setClosingCash(formatNumericInput(String(closeExpectedCash)));
                        }
                        if (!matches) {
                          setClosingCash(formatNumericInput(String(closeExpectedAfterDelivery)));
                        }
                      }}
                      className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                    >
                        <option value="yes">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                    {!closeMatchesCash && (
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Efectivo contado</span>
                        <input
                          value={closingCash}
                          onChange={(e) => setClosingCash(formatNumericInput(e.target.value))}
                          inputMode="numeric"
                          className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                        />
                      </label>
                    )}
                  </>
                )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="submit" className="rounded bg-[#003D9B] px-4 py-2 text-sm font-medium text-white" disabled={loading}>
                    {closeStep === 1 ? "Continuar" : "Confirmar cierre"}
                  </button>
                  {closeStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setCloseStep(1)}
                      className="rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-900"
                    >
                      Atrás
                    </button>
                  )}
                  <button type="button" onClick={closeActionModal} className="rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-900">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Historial</p>
                  <h3 className="text-2xl font-semibold text-[#003D9B]">Historial caja</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <div className="mt-4 max-h-[60vh] overflow-auto">
                {historyLoading && <p className="text-sm text-slate-600">Cargando historial...</p>}
                {historyError && <p className="text-sm text-red-700">{historyError}</p>}
                {!historyLoading && !historyError && (
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
                        <th className="py-3 pr-3">Fecha</th>
                        <th className="py-3 pr-3">Evento</th>
                        <th className="py-3 pr-3">Usuario</th>
                        <th className="py-3 pr-3">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-3 pr-3 whitespace-nowrap">{new Date(item.event_at).toLocaleString("es-CO")}</td>
                          <td className="py-3 pr-3 font-medium">{item.event_label}</td>
                          <td className="py-3 pr-3">{item.actor_label ?? item.actor_id}</td>
                          <td className="py-3 pr-3 text-slate-600">{item.note ?? "-"}</td>
                        </tr>
                      ))}
                      {historyItems.length === 0 && (
                        <tr>
                          <td className="py-4 text-slate-500" colSpan={4}>
                            No hay eventos para esta fecha.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeAction === "delivery" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Movimiento</p>
                  <h3 className="text-2xl font-semibold text-[#003D9B]">Entrega a Bóveda</h3>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <form className="mt-4" onSubmit={(e) => submitAction(e, "delivery")}>
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Monto</span>
                    <input
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(formatNumericInput(e.target.value))}
                      inputMode="numeric"
                      className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Descripción</span>
                    <input
                      value={movementDescription}
                      onChange={(e) => setMovementDescription(e.target.value)}
                      className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                    />
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="submit" className="rounded bg-[#003D9B] px-4 py-2 text-sm font-medium text-white" disabled={loading}>
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-900"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <article className="rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Apertura</p>
            <p className="pt-4 text-5xl font-bold text-[#003D9B]">{money(metrics.opening)}</p>
            <p className="pt-4 text-base text-slate-600">Verificado al cargar la caja</p>
          </article>
          
          <article className="rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Efectivo en Bóveda</p>
            <p className="pt-4 text-5xl font-bold text-[#003D9B]">{money(metrics.vaultBalance)}</p>
            <p className="pt-4 text-sm text-red-600">Efectivo Transferido a Boveda.</p>
          </article>
          <article className="rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Efectivo en Caja</p>
            <p className="pt-4 text-5xl font-bold text-[#003D9B]">{money(metrics.cashBalance)}</p>
            <p className="pt-4 text-base text-slate-600">Calculado en tiempo real</p>
          </article>
          <article className="rounded border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Ingresos -  Solo fectivo</p>
            <p className="pt-4 text-5xl font-bold text-[#003D9B]">{money(metrics.cashIn)}</p>
            <p className="pt-4 text-base text-emerald-600">Ventas acumuladas y apertura</p>
          </article>
        </section>


        <section className="overflow-hidden rounded border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-semibold text-[#003D9B]">Registro de Movimientos</h2>
              <span className="text-sm text-slate-600">
                {loading ? "Cargando..." : `Mostrando ${movementPagination.visibleRows.length} de ${movementPagination.total} movimientos`}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
              <label className="w-full text-sm text-slate-700 sm:w-[320px]">
                <span className="block pb-1">Buscar</span>
                <input
                  value={movementSearch}
                  onChange={(e) => setMovementSearch(e.target.value)}
                  placeholder="Tipo, descripción, ref, monto..."
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                />
              </label>
              <label className="whitespace-nowrap text-sm text-slate-700">
                Mostrar
                <select
                  value={movementPageSize}
                  onChange={(e) =>
                    setMovementPageSize(
                      e.target.value === "all" ? "all" : (Number(e.target.value) as 5 | 10 | 20),
                    )
                  }
                  className="ml-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value="all">Todos</option>
                </select>
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-5 py-3">Hora</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3">Ref / ID</th>
                  <th className="px-5 py-3 text-right">Efectivo</th>
                  <th className="px-5 py-3 text-right">Otros métodos</th>
                  <th className="px-5 py-3 text-right">Bóveda</th>
                </tr>
              </thead>
              <tbody>
                {movementPagination.visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 text-sm">
                    <td className="px-5 py-3 text-slate-700">
                      {new Date(String(row.dateLabel)).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const meta = typeMeta(row.type);
                        return (
                          <span
                            className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.5px] ${meta.className}`}
                          >
                            <span className="material-symbols-outlined text-[10px] leading-none">{meta.icon}</span>
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const normalized = String(row.status ?? "").toLowerCase();
                        const isCancelled = ["cancelled", "canceled", "anulada", "cancelada"].includes(normalized);
                        const isConfirmed = ["confirmed", "confirmada"].includes(normalized);
                        const className = isCancelled
                          ? "bg-rose-100 text-rose-700 ring-rose-200"
                          : isConfirmed
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200";
                        const label = isCancelled
                          ? "ANULADA"
                          : isConfirmed
                            ? "CONFIRMADA"
                            : row.status
                              ? String(row.status).toUpperCase()
                              : "-";
                        return (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.5px] ring-1 ring-inset ${className}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3 text-[#003D9B] capitalize tracking-[0.26px]">
                      <div
                        title={row.description}
                        className="max-w-[320px] whitespace-normal break-words leading-5 line-clamp-2"
                      >
                        {row.description}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700 uppercase">{row.reference}</td>
                    <td className={`px-5 py-3 font-semibold ${Number(row.cashAmount) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      <div className="flex w-full items-center justify-between gap-2"><span>$</span><span className="text-right tabular-nums">{money(Math.abs(Number(row.cashAmount))).replace("$", "").trim()}</span></div>
                    </td>
                    <td className={`px-5 py-3 font-semibold ${Number(row.otherAmount) < 0 ? "text-red-600" : "text-slate-800"}`}>
                      {Number(row.otherAmount) ? <div className="flex w-full items-center justify-between gap-2"><span>$</span><span className="text-right tabular-nums">{money(Math.abs(Number(row.otherAmount))).replace("$", "").trim()}</span></div> : <span className="block text-right">--</span>}
                    </td>
                    <td className={`px-5 py-3 font-semibold ${Number(row.vaultAmount) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {Number(row.vaultAmount) ? <div className="flex w-full items-center justify-between gap-2"><span>$</span><span className="text-right tabular-nums">{money(Math.abs(Number(row.vaultAmount))).replace("$", "").trim()}</span></div> : <span className="block text-right">--</span>}
                    </td>
                  </tr>
                ))}
                {!movementPagination.visibleRows.length && (
                  <tr>
                      <td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={8}>
                      No hay movimientos para esta fecha.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-600">
              Página {movementPagination.currentPage} de {movementPagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMovementPage((page) => Math.max(1, page - 1))}
                disabled={movementPageSize === "all" || movementPagination.currentPage === 1}
                className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setMovementPage((page) => Math.min(movementPagination.totalPages, page + 1))}
                disabled={movementPageSize === "all" || movementPagination.currentPage === movementPagination.totalPages}
                className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Desglose</p>
                  <h3 className="text-2xl font-semibold text-[#003D9B]">Otros métodos de pago</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {paymentSummary.map((item) => (
                  <div key={item.method} className="rounded border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{item.method}</p>
                    <p className="mt-2 text-3xl font-bold text-[#003D9B]">{money(item.amount)}</p>
                  </div>
                ))}
                {!paymentSummary.length && (
                  <p className="text-sm text-slate-500">No hay pagos distintos de efectivo para esta fecha.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
