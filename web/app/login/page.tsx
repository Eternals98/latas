"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("vendedor");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        setError(payload?.detail || "Credenciales inválidas.");
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setError("No se pudo conectar con el servicio de login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#eceef4] px-6 py-16 font-[Inter] text-[#0b1c30]">
      <header className="fixed left-0 top-0 z-30 flex w-full items-center justify-between px-6 py-4">
        <h1 className="font-manrope text-[40px] font-extrabold tracking-[-0.02em] text-blue-600">Axentria</h1>
        <button type="button" aria-label="Ayuda" className="text-blue-600">
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>
      </header>

      <section className="w-full max-w-[420px]">
        <div className="text-center">
          <h2 className="font-manrope text-[48px] font-bold leading-[1.06] tracking-[-0.02em]">Bienvenido de nuevo</h2>
          <p className="mx-auto mt-2 max-w-[370px] text-[15px] leading-6 text-slate-600">
            Por favor, introduce tus credenciales para acceder a tu cuenta.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Usuario
            <div className="group relative mt-2 border-b border-slate-300">
              <span className="material-symbols-outlined pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 group-focus-within:text-blue-600">
                mail
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
            <span className="flex items-center justify-between">
              Contraseña
              <span className="text-xs font-semibold text-blue-600">¿Olvidaste tu contraseña?</span>
            </span>
            <div className="group relative mt-2 border-b border-slate-300">
              <span className="material-symbols-outlined pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 group-focus-within:text-blue-600">
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
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
                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-blue-700 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <span>{isSubmitting ? "Ingresando..." : "Iniciar sesión"}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">Admin: admin/admin | Vendedor: vendedor/vendedor</p>
        {error && <p className="mt-2 text-center text-sm text-rose-700">{error}</p>}
      </section>

      <footer className="fixed bottom-0 left-0 flex w-full justify-center px-4 pb-8 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-5">
          <a href="#" className="hover:text-blue-600">
            Privacidad
          </a>
          <a href="#" className="hover:text-blue-600">
            Términos
          </a>
          <span>© 2024 Axentria Financial. Todos los derechos reservados.</span>
        </div>
      </footer>
    </main>
  );
}
