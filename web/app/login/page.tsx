"use client";

import { FormEvent, useState } from "react";
import { getCsrfHeaders } from "../../lib/csrf-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({ email, password })
      });
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        setError(payload?.detail || "Credenciales incorrectas. Intente nuevamente.");
        return;
      }
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = (await sessionResponse.json().catch(() => null)) as { role?: "admin" | "cashier" } | null;
      window.location.assign(session?.role === "cashier" ? "/salesRegister" : "/dashboard");
    } catch {
      setError("No se puede conectar al servidor. Intenta nuevamente más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E3EAFF] px-4 text-[#263b69] antialiased">
      <section className="h-[496px] w-full max-w-[380px] ">
        {/* Header */}
        <div className="h-[156px] mb-8 flex flex-col items-center justify-center"> 
          <div className="flex w-[60px] h-[60px] mb-4 flex-col items-start justify-start ">
            <div className="flex w-[60px] h-[60px] items-center justify-center rounded-lg bg-[#003D9B] text-white">
              <span className="material-symbols-outlined">
                domain
              </span>
            </div>
          </div>

          <h1 className="h-12 text-[48px] tracking-[-2px] font-bold leading-9 text-[#121C27]">
            Axentria
          </h1>

          <p className="pt-1 text-center text-[24px] font-normal leading-5 text-[#4C5D8D]">
            Controla tus ventas
          </p>
        </div>

    {/* Card */}
    <div className="w-full h-[300px] rounded-lg bg-[#FFFFFF] px-6 pb-10 pt-6 outline outline-1 outline-offset-[-1px] outline-[#C3C6D6]">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 h-[234px]">
        {/* Usuario */}
        <label className="flex w-full flex-col gap-1.5">
          <span className="text-xs font-bold uppercase leading-4 text-[#4C5D8D]">
            Correo electrónico
          </span>

          <div className="relative h-10 w-full overflow-hidden rounded-lg bg-white outline outline-1 outline-offset-[-1px] outline-[#C3C6D6] focus-within:outline-[#003D9B]">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2 text-[14px] text-[#737685]">
              mail
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-full w-full bg-transparent pl-12 pr-3 text-sm font-normal leading-5 text-[#121C27] outline-none placeholder:text-[#C3C6D6]"
              placeholder=""
              autoComplete="email"
              required
            />
          </div>
        </label>

        {/* Contraseña */}
        <label className="flex w-full flex-col gap-1.5 h-[84px]">
          <span className="text-xs font-bold uppercase leading-4 text-[#4C5D8D]">
            Contraseña
          </span>

          <div className="relative h-10 w-full overflow-hidden rounded-lg border border-[#C3C6D6] bg-white focus-within:border-[#003D9B]">
            {error && (
              <div className="absolute left-0 top-0 h-10 w-[2px] bg-[#BA1A1A]" />
            )}

            <span
              className={`material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] ${
                error ? "text-[#BA1A1A]" : "text-[#737685]"
              }`}
            >
              lock
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`h-full w-full bg-transparent pr-3 text-sm leading-8 text-[#121C27] outline-none ${
                error ? "pl-12" : "pl-12"
              }`}
              required
            />
          </div>

          {error && (
            <p className="flex mt-2 h-1 items-center  gap-1.5 text-xs font-normal leading-5 text-[#BA1A1A]">
              <span className="material-symbols-outlined text-[14px]">
                error
              </span>
              {error}
            </p>
          )}
        </label>

        {/* Botón */}
        <div className="w-full pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#003D9B] px-3 text-sm font-medium leading-5 text-white outline outline-1 outline-offset-[-1px] outline-[#003D9B] transition hover:bg-[#002f78] disabled:cursor-not-allowed disabled:bg-[#4C5D8D]"
          >
            <span>{isSubmitting ? "Ingresando..." : "Ingresar"}</span>
            <span className="material-symbols-outlined text-[14px]">
              arrow_forward
            </span>
          </button>
        </div>
      </form>
    </div>
  </section>
</main>
  );
}
