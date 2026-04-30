import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { decodeSessionUser, SESSION } from "../lib/session";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/registro", label: "Registro" },
  { href: "/transacciones", label: "Transacciones" },
  { href: "/clientes", label: "Clientes" },
  { href: "/reportes", label: "Reportes" },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = decodeSessionUser(cookieStore.get(SESSION.cookieName)?.value);

  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body>
        {session && (
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm font-medium text-slate-700">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-slate-100">
                  {link.label}
                </Link>
              ))}
              <span className="ml-auto whitespace-nowrap rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {session.username} ({session.role})
              </span>
              <LogoutButton />
            </nav>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
