import { useState } from 'react'

import { ClientesPage } from './pages/ClientesPage'
import { DashboardPage } from './pages/DashboardPage'
import { RegistroVentasPage } from './pages/RegistroVentasPage'

function App() {
  const [view, setView] = useState<'dashboard' | 'registro' | 'clientes'>('dashboard')

  return (
    <div className="min-h-screen bg-app-surface text-slate-900">
      <div className="flex min-h-screen">
        <aside className="flex w-20 flex-col border-r border-slate-200 bg-white px-3 py-5 md:w-64 md:px-5">
          <div className="mb-10 flex items-center gap-3">
            <span className="text-lg font-semibold text-blue-600">||</span>
            <span className="hidden text-lg font-bold text-slate-900 md:inline">Invoicely</span>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                view === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-base">#</span>
              <span className="hidden md:inline">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setView('registro')}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                view === 'registro' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-base">+</span>
              <span className="hidden md:inline">Registro de Ventas</span>
            </button>
            <button
              type="button"
              onClick={() => setView('clientes')}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                view === 'clientes' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-base">C</span>
              <span className="hidden md:inline">Clientes</span>
            </button>
          </nav>
          <div className="mt-6 flex justify-center md:justify-end">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              JT
            </span>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {view === 'dashboard' && <DashboardPage />}
          {view === 'registro' && <RegistroVentasPage />}
          {view === 'clientes' && <ClientesPage />}
        </div>
      </div>
    </div>
  )
}

export default App
