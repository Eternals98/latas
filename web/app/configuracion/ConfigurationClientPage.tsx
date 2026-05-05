"use client";

import { useState } from "react";
import { getCsrfHeaders } from "../../lib/csrf-client";

type MigrationResponse = {
  imported_sheets: number;
  imported_rows: number;
  sale_transactions: number;
  cancelled_transactions: number;
  grouped_document_count: number;
  cash_movements: number;
  cash_in_movements: number;
  cash_out_movements: number;
  vault_in_movements: number;
  payment_rows: number;
  warnings: string[];
  period_start: string | null;
  period_end: string | null;
};

export default function ConfigurationClientPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MigrationResponse | null>(null);

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("month", month);
      const response = await fetch("/api/bff/admin/historic-migration", {
        method: "POST",
        headers: getCsrfHeaders(),
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as MigrationResponse | { detail?: string } | null;
      if (!response.ok) {
        throw new Error((body && "detail" in body && body.detail) || "No fue posible migrar el histórico.");
      }
      setResult(body as MigrationResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible migrar el histórico.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="mt-2 text-slate-600">
          Sube el Excel histórico para migrar transacciones, anulaciones y movimientos operativos.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Reglas de migración</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Ventas en efectivo generan <code>cash_in</code>.</li>
            <li>Pagos con <code>ENTREGA</code> generan <code>cash_out</code> y <code>vault_in</code>.</li>
            <li>Devoluciones y anulaciones generan <code>cash_out</code> cuando afectan efectivo.</li>
            <li>Si una fila trae varios valores en <code>F:R</code>, se crean varios <code>transaction_payments</code>.</li>
            <li>Cada hoja del libro crea una caja histórica con eventos de apertura y cierre.</li>
          </ul>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entrada</p>
            <p className="mt-2 text-sm text-slate-700">Un Excel por período. Se ignora la hoja <code>Consolidado</code>.</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salida</p>
            <p className="mt-2 text-sm text-slate-700">Se crean transacciones, pagos, caja y eventos de apertura/cierre por hoja.</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control</p>
            <p className="mt-2 text-sm text-slate-700">Si hay diferencia entre `E` y `F:R`, la migración lo deja en advertencias.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Mes del histórico
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Archivo Excel
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={!file || loading}
              className="rounded-lg bg-[#003D9B] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Migrando..." : "Migrar histórico"}
            </button>
            {file && <span className="text-sm text-slate-600">{file.name}</span>}
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          {result && (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-medium">Migración completada</p>
              <p>Hojas importadas: {result.imported_sheets}</p>
              <p>Filas procesadas: {result.imported_rows}</p>
              <p>Transacciones: {result.sale_transactions}</p>
              <p>Anuladas: {result.cancelled_transactions}</p>
              <p>Documentos agrupados: {result.grouped_document_count}</p>
              <p>Movimientos de caja: {result.cash_movements}</p>
              <p>Cash in: {result.cash_in_movements}</p>
              <p>Cash out: {result.cash_out_movements}</p>
              <p>Vault in: {result.vault_in_movements}</p>
              <p>Pagos registrados: {result.payment_rows}</p>
              {result.period_start && result.period_end && (
                <p>
                  Período: {result.period_start} a {result.period_end}
                </p>
              )}
              {result.warnings.length > 0 && (
                <div>
                  <p className="font-medium">Advertencias</p>
                  <ul className="mt-1 list-disc pl-5">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.grouped_document_count > 0 && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                  Hay {result.grouped_document_count} documento(s) con varias filas consolidadas en una sola transacción.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
