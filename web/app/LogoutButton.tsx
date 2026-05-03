"use client";

import { getCsrfHeaders } from "../lib/csrf-client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: getCsrfHeaders() });
    window.location.assign("/login");
  }

  return (
    <button type="button" onClick={logout} className="whitespace-nowrap rounded-md px-3 py-1.5 text-rose-700 hover:bg-rose-50">
      Cerrar sesión
    </button>
  );
}
