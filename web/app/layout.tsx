import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header style={{ background: "#14213d", color: "#fff", padding: "12px 24px" }}>
          <nav className="container" style={{ display: "flex", gap: 16 }}>
            <Link href="/">Dashboard</Link>
            <Link href="/ventas">Registro</Link>
            <Link href="/reportes">Reportes</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
