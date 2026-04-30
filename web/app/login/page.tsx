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
    <main className="relative flex min-h-screen flex-col bg-[#f8f9ff] px-6 py-16 font-[Inter] text-[#0b1c30] antialiased">
      <header className="fixed left-0 top-0 z-30 flex w-full items-center justify-between px-6 py-4">
        <h1 className="font-manrope text-[40px] font-black tracking-[-0.02em] text-blue-600">Axentria</h1>
        <button type="button" aria-label="Ayuda" className="text-blue-600">
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>
      </header>

      <section className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[400px]">
        <div className="text-center">
          <h2 className="font-manrope text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-[#0b1c30]">
            Bienvenido de nuevo
          </h2>
          <p className="mx-auto mt-1 max-w-[360px] text-[14px] leading-[20px] text-[#434655]">
            Por favor, introduce tus credenciales para acceder a tu cuenta.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-[14px] font-semibold leading-5 text-[#0b1c30]">
            Correo electrónico
            <div className="group relative border-b border-[#c3c6d7]">
              <span className="material-symbols-outlined pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[20px] text-[#737686] transition-colors group-focus-within:text-blue-600">
                mail
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="nombre@empresa.com"
                className="h-12 w-full rounded-none bg-transparent pl-10 pr-4 text-[16px] leading-6 outline-none placeholder:text-[#c3c6d7]"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-[14px] font-semibold leading-5 text-[#0b1c30]">
            <span className="flex items-baseline justify-between">
              <span>Contraseña</span>
              <a href="#" className="text-[12px] font-medium leading-4 text-blue-600">
                ¿Olvidaste tu contraseña?
              </a>
            </span>
            <div className="group relative border-b border-[#c3c6d7]">
              <span className="material-symbols-outlined pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[20px] text-[#737686] transition-colors group-focus-within:text-blue-600">
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-none bg-transparent pl-10 pr-10 text-[16px] leading-6 outline-none placeholder:text-[#c3c6d7]"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#737686] transition hover:text-[#0b1c30]"
                aria-label="Mostrar u ocultar contraseña"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0053db] px-4 text-[14px] font-semibold leading-5 text-white shadow-sm transition hover:bg-[#004ac6] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <span>{isSubmitting ? "Ingresando..." : "Iniciar sesión"}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>

        {error && <p className="mt-2 text-center text-sm text-rose-700">{error}</p>}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 flex w-full justify-center px-4 pb-8 text-[12px] leading-4 text-[#737686]">
        <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
          <a href="#" className="transition hover:text-blue-600">
            Privacidad
          </a>
          <a href="#" className="transition hover:text-blue-600">
            Términos
          </a>
          <span>© 2024 Axentria Financial. Todos los derechos reservados.</span>
        </div>
      </footer>
    </main>
  );
}
