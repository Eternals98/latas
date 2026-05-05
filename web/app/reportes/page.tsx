import { requireAdminSession } from "../../lib/session";

export default async function ReportesPage() {
  await requireAdminSession();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
      <p className="mt-2 text-slate-600">
        Reportería se implementa desde Fase 5. Esta base ya soporta autenticación y catálogos.
      </p>
    </main>
  );
}
