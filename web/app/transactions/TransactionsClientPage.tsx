"use client";

import { useEffect, useMemo, useState } from "react";
import { getCsrfHeaders } from "../../lib/csrf-client";
import { MultiSelectCombobox } from "../../components/combobox-multiselect";

type SalePayment = { id: string; payment_method_id: string; payment_method_name: string; amount: string };
type SaleItem = { id: string; company: { id: string; name: string }; customer: { id: string; name: string; phone: string | null } | null; transaction_date: string; document_number: string | null; description: string; total_amount: string; status: string; created_at: string; payments: SalePayment[] };
type SaleListResponse = { items: SaleItem[]; total: number; limit: number; offset: number };
type Company = { id: string; name: string };
type PaymentMethod = { id: string; name: string };
type EditPaymentLine = { payment_method_id: string; amount: string };
type SessionInfo = { authenticated: boolean; role?: "admin" | "cashier" };
type CashTodayResponse = { session?: { status?: string } };

const COP_FORMATTER = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const PAYMENT_METHOD_STYLES = ["bg-sky-100 text-sky-700 ring-sky-200", "bg-emerald-100 text-emerald-700 ring-emerald-200", "bg-amber-100 text-amber-700 ring-amber-200", "bg-violet-100 text-violet-700 ring-violet-200", "bg-rose-100 text-rose-700 ring-rose-200", "bg-cyan-100 text-cyan-700 ring-cyan-200"] as const;

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function formatDate(value: string): string { const [y, m, d] = value.split("-"); return `${d}/${m}/${y}`; }
function formatDateTime(value: string): string { const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return value; return parsed.toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function truncateDescription(description: string): string { return description.replace(/\s+/g, " ").trim(); }
function formatTransactionReference(reference: string | null | undefined): string { if (!reference) return "Selecciona una transacción"; const trimmed = reference.trim(); if (!trimmed) return "Selecciona una transacción"; return trimmed.toUpperCase().split("-")[0] ?? trimmed.toUpperCase(); }
function isCashOpen(status?: string | null): boolean { if (!status) return false; return ["open", "opened", "open_session", "abierta", "active"].includes(status.toLowerCase()); }
function paymentMethodClass(name: string): string { const normalized = name.trim().toLowerCase(); const knownStyles: Record<string, string> = { efectivo: "bg-emerald-100 text-emerald-700 ring-emerald-200", cash: "bg-emerald-100 text-emerald-700 ring-emerald-200", tarjeta: "bg-sky-100 text-sky-700 ring-sky-200", debito: "bg-indigo-100 text-indigo-700 ring-indigo-200", "débito": "bg-indigo-100 text-indigo-700 ring-indigo-200", credito: "bg-violet-100 text-violet-700 ring-violet-200", "crédito": "bg-violet-100 text-violet-700 ring-violet-200", transfer: "bg-amber-100 text-amber-700 ring-amber-200", transferencia: "bg-amber-100 text-amber-700 ring-amber-200", nequi: "bg-cyan-100 text-cyan-700 ring-cyan-200", daviplata: "bg-rose-100 text-rose-700 ring-rose-200", banco: "bg-slate-100 text-slate-700 ring-slate-200" }; return knownStyles[normalized] ?? PAYMENT_METHOD_STYLES[normalized.length % PAYMENT_METHOD_STYLES.length]; }
function saleStatusLabel(status: string): string { const normalized = status.trim().toLowerCase(); const map: Record<string, string> = { confirmed: "CONFIRMADA", confirmada: "CONFIRMADA", cancelled: "ANULADA", anulada: "ANULADA", canceled: "ANULADA", cancelada: "ANULADA" }; return map[normalized] ?? normalized.toUpperCase(); }
function saleStatusClass(status: string): string { const normalized = status.trim().toLowerCase(); if (["anulada", "cancelada", "canceled", "cancelled"].includes(normalized)) return "bg-slate-100 text-slate-600 ring-slate-200"; if (["confirmed", "confirmada"].includes(normalized)) return "bg-emerald-100 text-emerald-700 ring-emerald-200"; return "bg-slate-100 text-slate-700 ring-slate-200"; }

export default function TransactionsClientPage() {
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [role, setRole] = useState<"admin" | "cashier" | null>("admin");
  const [cashIsOpen, setCashIsOpen] = useState(false);
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [paymentMethodIds, setPaymentMethodIds] = useState<string[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SaleItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editPayments, setEditPayments] = useState<EditPaymentLine[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  async function loadLookupData() { const [companyResponse, paymentMethodResponse] = await Promise.all([fetch("/api/bff/companies", { cache: "no-store" }), fetch("/api/bff/payment-methods", { cache: "no-store" })]); const [companyBody, paymentMethodBody] = await Promise.all([companyResponse.json(), paymentMethodResponse.json()]); if (companyResponse.ok) setCompanies(companyBody as Company[]); if (paymentMethodResponse.ok) setPaymentMethods(paymentMethodBody as PaymentMethod[]); }
  async function loadSessionInfo() { try { const response = await fetch("/api/auth/session", { cache: "no-store" }); const body = (await response.json()) as SessionInfo; if (response.ok && body.authenticated) setRole(body.role ?? null); } catch { setRole(null); } }
  async function loadCashState() { try { const response = await fetch(`/api/bff/cash/today?session_date=${encodeURIComponent(dateFrom)}`, { cache: "no-store" }); if (!response.ok) return; const body = (await response.json()) as CashTodayResponse; setCashIsOpen(isCashOpen(body.session?.status ?? null)); } catch { setCashIsOpen(false); } }
  async function loadSales() { setIsLoading(true); setError(null); try { const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, limit: "100", offset: "0" }); if (search.trim()) params.set("search", search.trim()); companyIds.forEach((id) => params.append("company_ids", id)); paymentMethodIds.forEach((id) => params.append("payment_method_ids", id)); const response = await fetch(`/api/bff/sales?${params.toString()}`, { cache: "no-store" }); const body = (await response.json()) as SaleListResponse | { detail?: string }; if (!response.ok) { const detailText = "detail" in body ? body.detail : undefined; throw new Error(detailText || "No fue posible cargar transacciones."); } setItems((body as SaleListResponse).items); setTotal((body as SaleListResponse).total); } catch (e) { setError(e instanceof Error ? e.message : "No fue posible cargar transacciones."); setItems([]); setTotal(0); } finally { setIsLoading(false); } }

  useEffect(() => { loadSessionInfo().catch(() => undefined); loadLookupData().catch(() => undefined); loadSales(); loadCashState(); }, []);
  useEffect(() => { const handle = window.setTimeout(() => { loadSales(); }, 250); return () => window.clearTimeout(handle); }, [dateFrom, dateTo, search, companyIds, paymentMethodIds]);
  useEffect(() => { loadCashState(); }, [dateFrom]);
  useEffect(() => { if (!selectedSaleId) { setDetail(null); return; } let cancelled = false; setIsDetailLoading(true); fetch(`/api/bff/sales/${selectedSaleId}`, { cache: "no-store" }).then(async (response) => { const body = (await response.json()) as SaleItem | { detail?: string }; if (!response.ok) { const detailText = "detail" in body ? body.detail : undefined; throw new Error(detailText || "No fue posible cargar detalle."); } if (!cancelled) setDetail(body as SaleItem); }).catch((e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e.message : "No fue posible cargar detalle."); setDetail(null); } }).finally(() => { if (!cancelled) setIsDetailLoading(false); }); return () => { cancelled = true; }; }, [selectedSaleId]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + Number(item.total_amount || "0"), 0), [items]);
  function toggleSelectedValue(values: string[], setter: (next: string[]) => void, value: string) { setter(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]); }
  const selectedSale = items.find((item) => item.id === selectedSaleId) ?? null;
  const visibleDetail = detail ?? selectedSale;
  const detailDocumentNumber = formatTransactionReference(detail?.document_number ?? selectedSale?.document_number ?? selectedSaleId);
  const canMutate = role === "admin" && cashIsOpen;
  useEffect(() => { if (!selectedSale) return; setEditDescription(selectedSale.description); setEditTransactionDate(selectedSale.transaction_date.slice(0, 16)); setEditCompanyId(selectedSale.company.id); setEditPayments(selectedSale.payments.map((payment) => ({ payment_method_id: payment.payment_method_id, amount: payment.amount }))); }, [selectedSale]);

  async function submitCancel() { if (!selectedSaleId || !cancelReason.trim() || !canMutate) return; setCancelSubmitting(true); try { const response = await fetch(`/api/bff/sales/${selectedSaleId}`, { method: "DELETE", headers: { ...getCsrfHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ reason: cancelReason.trim(), impact_cash: selectedSale?.payments.some((payment) => payment.payment_method_name.trim().toLowerCase().includes("efectivo")), }), }); if (!response.ok) { const fallback = await response.text().catch(() => ""); let detail = "No fue posible anular la transacción."; try { const parsed = fallback ? (JSON.parse(fallback) as { detail?: string }) : null; if (parsed?.detail) detail = parsed.detail; } catch { if (fallback.trim()) detail = fallback.trim(); } setError(detail); return; } setShowCancelModal(false); setCancelReason(""); setSelectedSaleId(null); loadSales(); setError(null); } finally { setCancelSubmitting(false); } }
  async function submitEdit() { if (!selectedSaleId || !canMutate) return; setEditSubmitting(true); try { const response = await fetch(`/api/bff/sales/${selectedSaleId}`, { method: "PUT", headers: { ...getCsrfHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ description: editDescription, transaction_date: new Date(editTransactionDate).toISOString(), company_id: editCompanyId, payments: editPayments, }), }); if (!response.ok) { const fallback = await response.text().catch(() => ""); let detail = "No fue posible editar la transacción."; try { const parsed = fallback ? (JSON.parse(fallback) as { detail?: string }) : null; if (parsed?.detail) detail = parsed.detail; } catch { if (fallback.trim()) detail = fallback.trim(); } setError(detail); return; } setShowEditModal(false); loadSales(); setError(null); } finally { setEditSubmitting(false); } }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#F7F9FF] px-3 py-2 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1400px] gap-3 xl:grid-cols-[minmax(0,1fr)_292px]">
        <div className="flex min-w-0 flex-col gap-3">
          <section className="rounded-[4px] border border-[#D6DDF5] bg-white px-3 py-2 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 pt-4 ml-2">
              <h1 className="text-[24px] font-semibold leading-none tracking-tight text-slate-900">Transacciones</h1>
            </div>
            <div className="pt-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[156px_156px_1fr_auto]">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 rounded-[4px] border border-[#D6DDF5] bg-[#F7F9FF] px-3 text-sm outline-none focus:border-[#B8C7F0]" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 rounded-[4px] border border-[#D6DDF5] bg-[#F7F9FF] px-3 text-sm outline-none focus:border-[#B8C7F0]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por referencia, cliente o teléfono" className="h-8 rounded-[4px] border border-[#D6DDF5] bg-[#F7F9FF] px-3 text-sm outline-none focus:border-[#B8C7F0]" />
              </div>
              <div className="mt-4 mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr]">
                <MultiSelectCombobox label="Empresas" options={companies} selectedIds={companyIds} onChange={setCompanyIds} placeholder="Todas las empresas" chipClassName=" rounded-[4px]border-[#D6DDF5] bg-[#F7F9FF] text-[#003D9B]" />
                <MultiSelectCombobox label="Métodos de pago" options={paymentMethods} selectedIds={paymentMethodIds} onChange={setPaymentMethodIds} placeholder="Todos los métodos" chipClassName="border-[#D6DDF5] bg-[#F7F9FF] text-[#003D9B]" />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-[#D6DDF5] bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">{isLoading ? "Cargando..." : `${items.length} transacciones visibles`}</span>
                {error && <span className="text-rose-700">{error}</span>}
              </div>
              <div className="mt-2 flex gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full bg-slate-100 px-3 py-1">Total listado: {COP_FORMATTER.format(totalAmount)}</span>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead className="bg-[#F7F9FF] text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Método de pago</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {!isLoading && items.length === 0 && (<tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No hay transacciones para estos filtros.</td></tr>)}
                  {!isLoading && items.map((item) => { const paymentLabel = item.payments.length === 0 ? "-" : item.payments.length === 1 ? item.payments[0]?.payment_method_name : "MULTIPLES"; const paymentStyle = item.payments.length === 1 ? paymentMethodClass(item.payments[0]?.payment_method_name ?? "") : "bg-slate-100 text-slate-700 ring-slate-200"; return (<tr key={item.id} onClick={() => setSelectedSaleId(item.id)} className={`group cursor-pointer border-t border-slate-100 transition hover:bg-[#F7F9FF] ${selectedSaleId === item.id ? "bg-[#F7F9FF]" : ""}`}><td className="relative px-4 py-3"><span className={`absolute left-0 top-0 h-full w-1 ${selectedSaleId === item.id ? "bg-[#003D9B]" : "bg-transparent group-hover:bg-[#B8C7F0]"}`} />{formatDateTime(item.transaction_date)}</td><td className="px-4 py-3">{item.company.name}</td><td className="px-4 py-3"><div className="font-medium text-slate-900 transition group-hover:text-[#003D9B]">{item.customer?.name ?? "Cliente genérico"}</div><div className="text-xs text-slate-500">{item.customer?.phone ?? "Sin teléfono"}</div></td><td className="px-4 py-3">{item.document_number ?? "-"}</td><td className="px-4 py-3"><div title={item.description} className="overflow-hidden text-ellipsis capitalize" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{truncateDescription(item.description)}</div></td><td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${paymentStyle} uppercase`}>{paymentLabel}</span></td><td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${saleStatusClass(item.status)}`}>{saleStatusLabel(item.status)}</span></td><td className="px-4 py-3 text-right font-semibold">{COP_FORMATTER.format(Number(item.total_amount || "0"))}</td></tr>); })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="overflow-hidden rounded-xl border border-[#D6DDF5] bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)] xl:sticky xl:top-2 xl:self-stretch">
          <div className="flex h-full flex-col">
            <div className="border-b border-[#D6DDF5] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.038em] text-slate-500">
                    Detalle de transacción
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">{detailDocumentNumber}</h2>
                </div>
                {selectedSaleId && (
                  <button
                    type="button"
                    onClick={() => setSelectedSaleId(null)}
                    className="rounded-md px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Limpiar selección"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-auto p-4">
                {isDetailLoading && <p className="text-sm text-slate-600">Cargando detalle...</p>}
                {!isDetailLoading && visibleDetail ? (
                  <div className="space-y-4">
                    <div className="rounded-[4px] border border-[#D6DDF5] bg-[#F7F9FF] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Monto total
                      </p>
                      <p className="mt-1 text-[32px] font-bold leading-tight text-slate-800">
                        {COP_FORMATTER.format(Number(visibleDetail.total_amount || "0"))}
                      </p>
                    </div>

                    <div className="space-y-3 border-b border-[#E6EBFA] pb-4 text-sm">
                      <div className="flex justify-between gap-4 border-b border-[#E6EBFA] pb-2">
                        <span className="text-slate-500">Fecha y hora</span>
                        <span className="text-right font-medium text-slate-900">
                          {formatDateTime(visibleDetail.transaction_date)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-[#E6EBFA] pb-2">
                        <span className="text-slate-500">Empresa</span>
                        <span className="text-right font-medium text-slate-900">{visibleDetail.company.name}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-[#E6EBFA] pb-2">
                        <span className="text-slate-500">Cliente</span>
                        <span className="max-w-[140px] text-right font-medium text-slate-900">
                          {visibleDetail.customer?.name ?? "Cliente genérico"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Descripción</span>
                        <span className="text-right font-medium text-slate-900">{visibleDetail.description}</span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Métodos de pago
                      </p>
                      <div className="overflow-hidden rounded-[4px] border border-[#D6DDF5]">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-[#F7F9FF] text-left text-[11px] uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Tipo</th>
                              <th className="px-3 py-2 font-semibold text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6EBFA]">
                            {visibleDetail.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${paymentMethodClass(payment.payment_method_name)}`}
                                  >
                                    {payment.payment_method_name}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-slate-900">
                                  {COP_FORMATTER.format(Number(payment.amount || "0"))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D6DDF5] bg-[#F7F9FF] p-4 text-sm text-slate-600">
                    Selecciona una fila para ver el detalle en este panel.
                  </div>
                )}
              </div>

              <div className="border-t border-[#D6DDF5] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    disabled={!canMutate || !selectedSale}
                    className="h-8 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={!canMutate || !selectedSale}
                    className="h-8 rounded-md border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anular
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {showCancelModal && selectedSale ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anular transacción</p>
                <h3 className="text-xl font-semibold text-slate-900">{detailDocumentNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-600">
                La anulación requiere motivo para auditoría. Si esta transacción tiene efectivo, el movimiento debe restar del flujo de caja.
              </p>
              <label className="block text-sm text-slate-700">
                Razón de anulación
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[#D6DDF5] bg-[#F7F9FF] px-3 py-2 outline-none focus:border-[#003D9B]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitCancel}
                  disabled={cancelSubmitting || !cancelReason.trim()}
                  className="rounded-md bg-[#003D9B] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelSubmitting ? "Anulando..." : "Confirmar anulación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showEditModal && selectedSale ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Editar transacción</p>
                <h3 className="text-xl font-semibold text-slate-900">{detailDocumentNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                Fecha
                <input
                  type="datetime-local"
                  value={editTransactionDate}
                  onChange={(e) => setEditTransactionDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D6DDF5] bg-[#F7F9FF] px-3 py-2 outline-none focus:border-[#003D9B]"
                />
              </label>
              <label className="block text-sm text-slate-700">
                Empresa
                <select
                  value={editCompanyId}
                  onChange={(e) => setEditCompanyId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D6DDF5] bg-[#F7F9FF] px-3 py-2 outline-none focus:border-[#003D9B]"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-700 md:col-span-2">
                Descripción
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[#D6DDF5] bg-[#F7F9FF] px-3 py-2 outline-none focus:border-[#003D9B]"
                />
              </label>
              <div className="md:col-span-2">
                <p className="mb-2 text-sm text-slate-700">Métodos de pago</p>
                <div className="space-y-3 rounded-lg border border-[#D6DDF5] p-3">
                  {editPayments.map((payment, index) => (
                    <div key={`${payment.payment_method_id}-${index}`} className="grid grid-cols-[1fr_140px_auto] gap-2">
                      <select
                        value={payment.payment_method_id}
                        onChange={(e) =>
                          setEditPayments((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, payment_method_id: e.target.value } : item,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-[#D6DDF5] bg-[#F7F9FF] px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                      >
                        {paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={payment.amount}
                        onChange={(e) =>
                          setEditPayments((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, amount: e.target.value } : item,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-[#D6DDF5] bg-[#F7F9FF] px-3 py-2 text-sm outline-none focus:border-[#003D9B]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditPayments((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                        disabled={editPayments.length === 1}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setEditPayments((current) => [
                        ...current,
                        { payment_method_id: paymentMethods[0]?.id ?? "", amount: "0" },
                      ])
                    }
                    className="rounded-lg border border-dashed border-[#B8C7F0] px-3 py-2 text-sm font-medium text-[#003D9B]"
                  >
                    Agregar método
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={editSubmitting}
                className="rounded-md bg-[#003D9B] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
