interface ReportesPageProps {
  embedded?: boolean
  onGoDashboard?: () => void
  onGoRegistro?: () => void
  onGoClientes?: () => void
  onGoTransacciones?: () => void
}

export function ReportesPage({
  embedded = false,
  onGoDashboard,
  onGoRegistro,
  onGoClientes,
  onGoTransacciones,
}: ReportesPageProps) {
  return (
    <div className="min-h-screen bg-[#eceef4] text-slate-900">
      {!embedded && (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-5">
          <h1 className="font-manrope text-lg font-extrabold tracking-tight text-blue-600">Reportes</h1>
        </div>
        </header>
      )}

      <div className="flex">
        {!embedded && (
          <aside className="hidden h-screen w-[170px] shrink-0 border-r border-slate-200 bg-[#f5f6fa] px-3 pt-14 lg:block">
          <nav className="mt-3 space-y-1">
            <button
              type="button"
              onClick={onGoDashboard}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Dashboard
            </button>
            <button
              type="button"
              onClick={onGoRegistro}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              Registrar venta
            </button>
            <button
              type="button"
              onClick={onGoTransacciones}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Transacciones
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md bg-blue-50 px-2 py-2 text-left text-xs font-bold text-blue-700"
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              Reportes
            </button>
          </nav>
          </aside>
        )}

        <main className={`w-full px-4 pb-20 ${embedded ? 'pt-6' : 'pt-20 lg:pl-6 lg:pr-6'}`}>
          <div className="mx-auto max-w-[1300px]">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Panel de reportes</h2>
              <p className="mt-2 text-sm text-slate-600">
                Esta vista ya mantiene la misma identidad y navegación lateral del Libro de ventas.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Reporte mensual</p>
                  <p className="mt-2 text-sm text-slate-700">Pendiente de implementación funcional.</p>
                </article>
                <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Comparativos</p>
                  <p className="mt-2 text-sm text-slate-700">Pendiente de implementación funcional.</p>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>

      {!embedded && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-slate-200 bg-white/90 px-2 backdrop-blur lg:hidden">
        <button type="button" onClick={onGoDashboard} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
          <span className="material-symbols-outlined">home</span>
          Dashboard
        </button>
        <button type="button" onClick={onGoRegistro} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
          <span className="material-symbols-outlined">point_of_sale</span>
          Registrar
        </button>
        <button
          type="button"
          onClick={onGoTransacciones}
          className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400"
        >
          <span className="material-symbols-outlined">payments</span>
          Pagos
        </button>
        <button type="button" onClick={onGoClientes} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-400">
          <span className="material-symbols-outlined">groups</span>
          Clientes
        </button>
        <button type="button" className="flex flex-col items-center justify-center rounded-xl bg-blue-50 px-3 py-1 text-[11px] text-blue-700">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            bar_chart
          </span>
          Reportes
        </button>
        </nav>
      )}
    </div>
  )
}
