import "./globals.css";
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "../lib/auth";
import { getSessionUser } from "../lib/session";
import { AppShell } from "./AppShell";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const authenticated = Boolean(cookieStore.get(AUTH_COOKIE)?.value);
  const sessionUser = authenticated ? await getSessionUser() : null;

  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body>
        {authenticated ? <AppShell role={sessionUser?.role}>{children}</AppShell> : children}
      </body>
    </html>
  );
}
