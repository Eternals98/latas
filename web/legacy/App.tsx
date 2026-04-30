import { useState } from 'react'

import { ClientesPage } from './pages/ClientesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LibroDiarioPage } from './pages/LibroDiarioPage'
import { LibroMensualPage } from './pages/LibroMensualPage'
import { RegistroVentasPage } from './pages/RegistroVentasPage'
import { TransaccionesPage } from './pages/TransaccionesPage'

type AppView = 'dashboard' | 'registro' | 'clientes' | 'ventas_transacciones' | 'ventas_libro_diario' | 'ventas_libro_mensual'

function App() {
  const [view, setView] = useState<AppView>('ventas_transacciones')
  const pageTitle = "Axentria"

  return (
    <div className="min-h-screen bg-[#eceef4] text-slate-900">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-5">
          <h1 className="font-manrope text-lg font-extrabold tracking-tight text-blue-600">{pageTitle}</h1>
        </div>
      </header>

      <div className="flex">
        <aside className="fixed bottom-0 left-0 top-14 hidden w-[170px] border-r border-slate-200 bg-[#f5f6fa] px-3 pt-3 lg:block">
          <nav className="mt-3 space-y-1">
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition ${
                view === 'dashboard' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setView('registro')}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition ${
                view === 'registro' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              Registrar venta
            </button>
            <div className="space-y-1">
              <div
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition ${
                  view === 'ventas_transacciones' || view === 'ventas_libro_diario' || view === 'ventas_libro_mensual'
                    ? 'bg-blue-50 font-bold text-blue-700'
                    : 'text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Ventas
              </div>
              <button
                type="button"
                onClick={() => setView('ventas_transacciones')}
                className={`ml-7 block rounded-md px-2 py-1.5 text-left text-xs font-medium transition ${
                  view === 'ventas_transacciones'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                Transacciones
              </button>
              <button
                type="button"
                onClick={() => setView('ventas_libro_diario')}
                className={`ml-7 block rounded-md px-2 py-1.5 text-left text-xs font-medium transition ${
                  view === 'ventas_libro_diario'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                Libro diario
              </button>
              <button
                type="button"
                onClick={() => setView('ventas_libro_mensual')}
                className={`ml-7 block rounded-md px-2 py-1.5 text-left text-xs font-medium transition ${
                  view === 'ventas_libro_mensual'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                Libro mensual
              </button>
            </div>
            <button
              type="button"
              onClick={() => setView('clientes')}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition ${
                view === 'clientes' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              Clientes
            </button>
          </nav>
        </aside>

        <main className="w-full px-0 pb-24 pt-14 lg:pl-[170px]">
          {view === 'dashboard' && <DashboardPage />}
          {view === 'registro' && <RegistroVentasPage />}
          {view === 'clientes' && <ClientesPage />}
          {view === 'ventas_transacciones' && <TransaccionesPage embedded />}
          {view === 'ventas_libro_diario' && <LibroDiarioPage />}
          {view === 'ventas_libro_mensual' && <LibroMensualPage />}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-slate-200 bg-white/90 px-2 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setView('dashboard')} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-500">
          <span className="material-symbols-outlined">home</span>
          Dashboard
        </button>
        <button type="button" onClick={() => setView('registro')} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-500">
          <span className="material-symbols-outlined">point_of_sale</span>
          Registrar
        </button>
        <button
          type="button"
          onClick={() => setView('ventas_transacciones')}
          className={`flex flex-col items-center justify-center rounded-xl px-3 py-1 text-[11px] ${
            view === 'ventas_transacciones' || view === 'ventas_libro_diario' || view === 'ventas_libro_mensual'
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-500'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings:
                view === 'ventas_transacciones' || view === 'ventas_libro_diario' || view === 'ventas_libro_mensual'
                  ? "'FILL' 1"
                  : "'FILL' 0",
            }}
          >
            payments
          </span>
          Ventas
        </button>
        <button type="button" onClick={() => setView('clientes')} className="flex flex-col items-center justify-center px-3 py-1 text-[11px] text-slate-500">
          <span className="material-symbols-outlined">groups</span>
          Clientes
        </button>
      </nav>
    </div>
  )
}

export default App
