'use client';

import { usePathname } from 'next/navigation';
import { Icon } from './Primitives';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs = () => {
  const pathname = usePathname();

  const breadcrumbs: BreadcrumbItem[] = [];
  const segments = pathname.split('/').filter(Boolean);

  // Construir breadcrumbs basado en la ruta
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    salesRegister: 'Registro de Ventas',
    'cash-management': 'Gestión de Caja',
    transactions: 'Transacciones',
    reportes: 'Reportes',
  };

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const label = labels[segment] || segment;

    if (index < segments.length - 1) {
      breadcrumbs.push({ label, href });
    } else {
      breadcrumbs.push({ label });
    }
  });

  return (
    <nav className="flex items-center gap-2 p-4 text-sm border-b text-slate-600 border-slate-200">
      <a href="/dashboard" className="hover:text-brass-600">
        Inicio
      </a>

      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Icon name="chevronRight" size={16} className="text-slate-400" />
          {item.href ? (
            <a href={item.href} className="hover:text-brass-600">
              {item.label}
            </a>
          ) : (
            <span className="font-semibold text-ink-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};