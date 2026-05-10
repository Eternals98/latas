import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Transacciones — LATAS' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
