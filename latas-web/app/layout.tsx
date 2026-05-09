import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Axentria — Sistema de Gestión",
    template: "%s — Axentria",
  },
  description: "Sistema integral de gestión de ventas y caja",
  keywords: ["ventas", "caja", "gestión", "transacciones"],
  authors: [{ name: "Axentria" }],
  creator: "Axentria",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://latas.app",
    title: "Axentria — Sistema de Gestión",
    description: "Plataforma moderna para gestión de ventas y caja",
    siteName: "Axentria",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e27",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}