'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import { Sidebar, TopBar } from '../components/Shell';
import { getCsrfHeaders } from '../lib/csrf-client';

type AppShellProps = {
  children: ReactNode;
  role?: 'admin' | 'cashier' | null;
};

export function AppShell({ children, role }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getCsrfHeaders(),
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const routeMap: { [key: string]: string } = {
    '/dashboard': 'dashboard',
    '/salesRegister': 'sale',
    '/transactions': 'transactions',
    '/cash-management': 'cash',
    '/reportes': 'reports',
    '/configuracion': 'admin',
  };

  const currentRoute = routeMap[pathname] || 'dashboard';

  const handleNavigate = (id: string) => {
    const pathMap: { [key: string]: string } = {
      dashboard: '/dashboard',
      sale: '/salesRegister',
      transactions: '/transactions',
      cash: '/cash-management',
      reports: '/reportes',
      admin: '/configuracion',
    };
    router.push(pathMap[id] || '/dashboard');
  };

  const metaMap: { [key: string]: { title: string; eyebrow: string; subtitle: string } } = {
    dashboard: {
      title: 'Resumen de Operaciones',
      eyebrow: 'Panel · 8 may 2026',
      subtitle: 'Visión general consolidada del día',
    },
    sale: {
      title: 'Registro de Venta',
      eyebrow: 'Operación · Nuevo asiento',
      subtitle: 'Capture una transacción comercial',
    },
    transactions: {
      title: 'Transacciones',
      eyebrow: 'Historial',
      subtitle: 'Registro completo de movimientos',
    },
    cash: {
      title: 'Gestión de Caja',
      eyebrow: 'Caja Diaria',
      subtitle: 'Movimientos y status del cajón',
    },
    reports: {
      title: 'Reportes Operativos',
      eyebrow: 'Informes',
      subtitle: 'Genere y exporte reportes auditables',
    },
    admin: {
      title: 'Administración',
      eyebrow: 'Sistema',
      subtitle: 'Usuarios, sucursales y catálogos',
    },
  };

  const meta = metaMap[currentRoute] || metaMap.dashboard;

  return (
    <div className="flex h-screen bg-paper-100 text-ink-900 font-sans">
      <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <Sidebar
          active={currentRoute}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          cashOpen={false}
        />
      </div>
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <TopBar {...meta} />
        <div className="flex-1 overflow-auto bg-paper-100">{children}</div>
      </main>
    </div>
  );
}
