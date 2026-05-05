"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { getCsrfHeaders } from "../lib/csrf-client";

/* =========================
   Tipos
========================= */
type NavItem = {
  href?: string;
  label: string;
  icon?: string;
  onClick?: () => void;
};

type AppShellProps = {
  children: ReactNode;
  role?: "admin" | "cashier" | null;
};

/* =========================
   Acción logout
========================= */
function logoutAction() {
  return async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: getCsrfHeaders() });
    window.location.assign("/login");
  };
}

/* =========================
   NAV
========================= */
const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/salesRegister", label: "Registro de ventas", icon: "point_of_sale" },
  { href: "/cash-management", label: "Gestión de caja", icon: "account_balance_wallet" },
  { href: "/transactions", label: "Transactions", icon: "receipt_long" },
  { href: "/reportes", label: "Reportes", icon: "analytics" },
  { href: "/configuracion", label: "Configuración", icon: "settings" },
  { href: "/clientes", label: "Clientes", icon: "groups" },
];

const ADMIN_ONLY_PATHS = new Set(["/dashboard", "/transactions", "/reportes", "/configuracion"]);

const FOOTER_NAV: NavItem[] = [
  {
    label: "Cerrar sesión",
    icon: "logout",
    onClick: logoutAction(),
  },
];

/* =========================
   NavLink
========================= */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const base =
    "flex h-10 items-center gap-3 pl-6 pr-4 text-sm font-medium relative z-10 transition";

  const color = active
    ? "text-white"
    : "text-[#334155] hover:bg-slate-100";

  // 🔹 Acción
  if (item.onClick) {
    return (
      <button
        onClick={item.onClick}
        className={`${base} ${color} w-full text-left`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            active ? "text-white" : "text-[#334155]"
          }`}
        >
          {item.icon}
        </span>
        <span>{item.label}</span>
      </button>
    );
  }

  // 🔹 Link
  return (
    <Link href={item.href!} className={`${base} ${color}`}>
      <span
        className={`material-symbols-outlined text-[18px] ${
          active ? "text-white" : "text-[#334155]"
        }`}
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

/* =========================
   AppShell
========================= */
export function AppShell({ children, role }: AppShellProps) {
  const pathname = usePathname();
  const visibleNav = role === "admin" ? MAIN_NAV : MAIN_NAV.filter((item) => !item.href || !ADMIN_ONLY_PATHS.has(item.href));

  const activeIndex = useMemo(() => {
    return visibleNav.findIndex(
      (i) =>
        i.href &&
        (pathname === i.href || pathname.startsWith(`${i.href}/`))
    );
  }, [pathname, visibleNav]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[240px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2563eb] text-sm font-extrabold text-white">
              Ax
            </div>
            <div>
              <p className="text-base font-extrabold text-[#1e3a8a]">
                Axentria
              </p>
              <p className="text-xs text-slate-500">
                Control de ventas
              </p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="relative flex-1 py-4">
          
          {/* 🔵 Indicador animado */}
          {activeIndex >= 0 && (
            <div
              className="absolute left-0 h-10 w-full bg-[#003D9B] rounded-r-full 
              transition-all duration-300 
              ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                transform: `translateY(${activeIndex * 40}px) scaleX(1.03)`
              }}
            />
          )}

          {/* Items */}
          {visibleNav.map((item) => {
            const active =
              item.href &&
              (pathname === item.href ||
                pathname.startsWith(`${item.href}/`));

            return (
              <NavLink key={item.label} item={item} active={!!active} />
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 py-3">
          {FOOTER_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={false} />
          ))}
        </div>
      </aside>

      {/* Content */}
      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-slate-600">
              Sesión activa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
              <span className="material-symbols-outlined text-[18px]">
                search
              </span>
            </button>

            <button className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
              <span className="material-symbols-outlined text-[18px]">
                notifications
              </span>
            </button>

            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
            </button>
          </div>
        </header>

        <div>{children}</div>
      </div>
    </div>
  );
}
