import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Axentria — Acceso al sistema',
  description: 'Sistema de gestión de ventas y caja',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-paper-100">
      {children}
    </div>
  );
}