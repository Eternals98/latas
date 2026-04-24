import { useState } from 'react'

import { DashboardPage } from './pages/DashboardPage'
import { RegistroVentasPage } from './pages/RegistroVentasPage'

function App() {
  const [view, setView] = useState<'dashboard' | 'registro'>('dashboard')

  return (
    <>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl gap-2 px-4 py-3 md:px-8">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              view === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView('registro')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              view === 'registro' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Registro de Ventas
          </button>
        </div>
      </nav>
      {view === 'dashboard' ? <DashboardPage /> : <RegistroVentasPage />}
    </>
  )
}

export default App
