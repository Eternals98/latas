import "./globals.css";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { AUTH_COOKIE } from "../lib/auth";
import { getSessionUser } from "../lib/session";
import { AppShell } from "./AppShell";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const authenticated = Boolean(cookieStore.get(AUTH_COOKIE)?.value);
  const sessionUser = authenticated ? await getSessionUser() : null;

  return (
    <html lang="es">
      <body suppressHydrationWarning>
        {authenticated ? <AppShell role={sessionUser?.role}>{children}</AppShell> : children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
