import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Gestión de Caja — LATAS' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
