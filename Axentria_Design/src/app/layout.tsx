import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Axentria — Sistema de Ventas",
  description: "El libro de ventas, hecho aplicación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0f1b2d" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
