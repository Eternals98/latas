import { useState, type FormEvent } from 'react'

import { authenticate, type AppSession } from '../auth'

interface LoginPageProps {
  onLogin: (session: AppSession) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('vendedor')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const session = authenticate(username, password)
    if (!session) {
      setError('Usuario o contraseña inválidos.')
      return
    }
    onLogin(session)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#eceef4] px-6 py-16 font-[Inter] text-[#0b1c30]">
      <header className="fixed left-0 top-0 z-30 flex w-full items-center justify-between px-6 py-4">
        <h1 className="font-manrope text-[40px] font-extrabold tracking-[-0.02em] text-blue-600">Axentria</h1>
      </header>

      <section className="w-full max-w-[420px]">
        <div className="text-center">
          <h2 className="font-manrope text-[48px] font-bold leading-[1.06] tracking-[-0.02em]">Bienvenido de nuevo</h2>
          <p className="mx-auto mt-2 max-w-[370px] text-[15px] leading-6 text-slate-600">
            Por favor, introduce tus credenciales para acceder a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Usuario
            <div className="group relative mt-2 border-b border-slate-300">
              <span className="material-symbols-outlined pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 group-focus-within:text-blue-600">
                person
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="vendedor o admin"
                className="h-11 w-full bg-transparent pl-8 pr-2 text-base outline-none placeholder:text-slate-400"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Contraseña
            <div className="group relative mt-2 border-b border-slate-300">
              <span className="material-symbols-outlined pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 group-focus-within:text-blue-600">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-11 w-full bg-transparent pl-8 pr-10 text-base outline-none placeholder:text-slate-400"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                aria-label="Mostrar u ocultar contraseña"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <span>Iniciar sesión</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">Admin: admin/admin | Vendedor: vendedor/vendedor</p>
        {error && <p className="mt-2 text-center text-sm text-rose-700">{error}</p>}
      </section>
    </main>
  )
}
