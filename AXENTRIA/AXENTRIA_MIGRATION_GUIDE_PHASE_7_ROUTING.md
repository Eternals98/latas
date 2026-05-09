# Axentria Design → Next.js Web
## PHASE 7: Routing, Navigation & Responsive Design

**Versión:** 1.0  
**Duración:** 1.5-2 horas  
**Objetivo:** Configurar navegación completa, rutas y responsiveness

---

## 📋 Tabla de Contenidos

1. [App Router Architecture](#app-router-architecture)
2. [Route Structure](#route-structure)
3. [Navegación Principal](#navegación-principal)
4. [Mobile Navigation](#mobile-navigation)
5. [Breadcrumbs](#breadcrumbs)
6. [Responsive Design](#responsive-design)
7. [Error & 404 Pages](#error--404-pages)
8. [SEO & Meta Tags](#seo--meta-tags)
9. [Transiciones entre páginas](#transiciones-entre-páginas)
10. [Checklist de Phase 7](#checklist)

---

## App Router Architecture

### Estructura de carpetas recomendada

```
app/
├── (auth)/                          # Grupo de rutas públicas
│   ├── login/
│   │   └── page.tsx
│   ├── registro/
│   │   └── page.tsx
│   └── layout.tsx                   # Sin sidebar
│
├── (dashboard)/                     # Grupo de rutas protegidas
│   ├── dashboard/
│   │   └── page.tsx
│   ├── salesRegister/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── cash-management/
│   │   └── page.tsx
│   ├── transactions/
│   │   └── page.tsx
│   ├── reportes/
│   │   └── page.tsx
│   ├── layout.tsx                   # Shell + sidebar
│   └── AppShell.tsx                 # Componente reutilizable
│
├── api/
│   └── auth/
│       ├── login/
│       │   └── route.ts
│       ├── logout/
│       │   └── route.ts
│       └── refresh/
│           └── route.ts
│
├── error.tsx                        # Error boundary global
├── not-found.tsx                    # 404 page
├── layout.tsx                       # Root layout
└── page.tsx                         # Home page (redirige a login)
```

### Ventajas de usar Route Groups

- **Layout aislados**: Auth pages sin sidebar, dashboard pages con sidebar
- **Organización lógica**: Agrupar rutas relacionadas
- **Modularidad**: Cada grupo tiene su propia estructura

---

## Route Structure

### Home Page (redirige a login)

**`app/page.tsx`:**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return null;
}
```

### Auth Layout (sin sidebar)

**`app/(auth)/layout.tsx`:**

```typescript
import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LATAS — Acceso al sistema',
  description: 'Sistema de gestión de ventas y caja',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

### Dashboard Layout (con sidebar)

**`app/(dashboard)/layout.tsx`:**

```typescript
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getSession } from '@/lib/get-session';
import { redirect } from 'next/navigation';
import { AppShell } from './AppShell';

export const metadata: Metadata = {
  title: 'LATAS — Panel de control',
  description: 'Panel de administración y gestión',
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <AppShell role={session.role}>{children}</AppShell>;
}
```

### Página de dashboard

**`app/(dashboard)/dashboard/page.tsx`:**

```typescript
'use client';

import { useDashboard } from '@/lib/hooks/useDashboard';
import { DashboardScreen } from '@/components/DashboardScreen';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — LATAS',
};

export default function DashboardPage() {
  const { metrics, loading, error } = useDashboard();

  if (error) {
    return <div className="p-8 text-coral-700">Error: {error}</div>;
  }

  return (
    <DashboardScreen
      metrics={metrics}
      loading={loading}
    />
  );
}
```

### Página de registro de ventas

**`app/(dashboard)/salesRegister/page.tsx`:**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SaleScreen } from '@/components/SaleScreen';
import { useSales } from '@/lib/hooks/useSales';
import { useCash } from '@/lib/hooks/useCash';
import { useLookupData } from '@/lib/hooks/useLookupData';
import { useSessionInfo } from '@/lib/hooks/useSessionInfo';

export default function SalesRegisterPage() {
  const router = useRouter();
  const { session: cashSession } = useCash();
  const { companies, customers, paymentMethods, loading: lookupsLoading } = useLookupData();
  const { profile } = useSessionInfo();
  const { creating, error, createSale, reset } = useSales();

  if (lookupsLoading) {
    return <div className="p-8 animate-pulse">Cargando catálogos...</div>;
  }

  const handleSubmit = async (payload: any) => {
    const result = await createSale(payload);
    if (result) {
      toast.success(`Venta ${result.document_number} registrada`);
      reset();
      router.refresh();
    }
  };

  return (
    <SaleScreen
      cashOpen={cashSession?.status === 'open'}
      openCash={() => router.push('/cash-management')}
      companies={companies}
      customers={customers}
      paymentMethods={paymentMethods}
      defaultCompanyId={profile?.company_id}
      submitting={creating}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
```

### Otras páginas de dashboard

**`app/(dashboard)/transactions/page.tsx`:**
**`app/(dashboard)/cash-management/page.tsx`:**
**`app/(dashboard)/reportes/page.tsx`:**

Siguen el mismo patrón: importar hooks → obtener datos → renderizar Screen.

---

## Navegación Principal

### AppShell Completo

**`app/(dashboard)/AppShell.tsx`:**

```typescript
'use client';

import React, { useState } from 'react';
import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon, Button, Avatar } from '@/components/Primitives';

interface ShellProps {
  children: ReactNode;
  role: 'admin' | 'cashier';
}

export const AppShell = ({ children, role }: ShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navItems =
    role === 'admin'
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: 'barChart3' },
          { href: '/transactions', label: 'Transacciones', icon: 'list' },
          { href: '/reportes', label: 'Reportes', icon: 'receipt' },
        ]
      : [
          { href: '/salesRegister', label: 'Nueva venta', icon: 'dollarSign' },
          { href: '/cash-management', label: 'Caja', icon: 'box' },
          { href: '/transactions', label: 'Historial', icon: 'list' },
        ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-paper-100">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:flex transition-all duration-300 bg-ink-900 text-paper-50 flex-col border-r border-ink-800`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-ink-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && <div className="text-xl font-bold font-display">LATAS</div>}
            <Button
              variant="text"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-paper-50 hover:bg-ink-800 ml-auto"
              icon={sidebarOpen ? 'chevronLeft' : 'chevronRight'}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href) ? 'bg-brass-500 text-ink-900' : 'hover:bg-ink-800'
              }`}
            >
              <Icon name={item.icon as any} size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-ink-800 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-paper-50 hover:bg-ink-800"
            icon="logOut"
          >
            {sidebarOpen && 'Salir'}
          </Button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-ink-900/40"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div
        className={`fixed left-0 top-0 bottom-0 w-64 bg-ink-900 text-paper-50 z-50 lg:hidden transition-transform ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-ink-800 flex items-center justify-between">
          <div className="text-xl font-bold font-display">LATAS</div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="text-paper-50 hover:bg-ink-800 p-2 rounded"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href) ? 'bg-brass-500 text-ink-900' : 'hover:bg-ink-800'
              }`}
            >
              <Icon name={item.icon as any} size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="p-4 space-y-3 border-t border-ink-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-paper-50 hover:bg-ink-800"
            icon="logOut"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <Button
            variant="text"
            size="sm"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden text-ink-900"
            icon="menu"
          />
          <div className="hidden lg:flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-3">
              <Avatar initials="JD" size="sm" />
              <span className="text-sm text-slate-700">Usuario</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
```

---

## Mobile Navigation

### Drawer Navigation Component

**`components/MobileNav.tsx`:**

```typescript
'use client';

import React from 'react';
import { Icon, Button } from './Primitives';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface MobileNavProps {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
  onNavigate?: (href: string) => void;
  currentPath?: string;
}

export const MobileNav = ({
  items,
  open,
  onClose,
  onNavigate,
  currentPath = '/',
}: MobileNavProps) => {
  const handleNavClick = (href: string) => {
    onNavigate?.(href);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-64 bg-ink-900 text-paper-50 z-50 lg:hidden transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-ink-800 flex items-center justify-between">
          <div className="text-xl font-bold">LATAS</div>
          <button
            onClick={onClose}
            className="text-paper-50 hover:bg-ink-800 p-2 rounded transition-colors"
            aria-label="Cerrar menú"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === item.href ? 'bg-brass-500 text-ink-900' : 'hover:bg-ink-800'
              }`}
            >
              <Icon name={item.icon as any} size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
};
```

---

## Breadcrumbs

### Breadcrumb Component

**`components/Breadcrumbs.tsx`:**

```typescript
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
    <nav className="flex items-center gap-2 text-sm text-slate-600 p-4 border-b border-slate-200">
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
            <span className="text-ink-900 font-semibold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};
```

### Uso en páginas

**`app/(dashboard)/salesRegister/page.tsx`:**

```typescript
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function SalesRegisterPage() {
  return (
    <>
      <Breadcrumbs />
      {/* Contenido */}
    </>
  );
}
```

---

## Responsive Design

### Breakpoints Tailwind

```css
/* Valores por defecto de Tailwind */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Patrón de responsive en componentes

**Login Screen responsivo:**

```typescript
<div className="paper-grain min-h-full grid place-items-center p-4 sm:p-8 bg-paper-100">
  {/* En móvil: ancho completo con padding mínimo */}
  {/* En desktop: ancho fijo 440px */}
  <div className="w-full sm:w-[440px]">
    {/* Contenido */}
  </div>
</div>
```

**Tablas responsivas:**

```typescript
<div className="overflow-x-auto">
  <table className="w-full min-w-[640px]">
    {/* Tabla */}
  </table>
</div>
```

**Grids responsivos:**

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Grid: 1 col en móvil, 2 en tablet, 4 en desktop */}
</div>
```

### Testing responsivo

```bash
# En desarrollo, usar DevTools de Chrome:
# Ctrl + Shift + I → Toggle device toolbar (Ctrl + Shift + M)

# Puntos de quiebre a probar:
# 360px (móvil pequeño)
# 768px (tablet)
# 1024px (desktop)
# 1280px (desktop grande)
```

---

## Error & 404 Pages

### 404 Page

**`app/not-found.tsx`:**

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Primitives';

export const metadata: Metadata = {
  title: 'Página no encontrada',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper-100 grid place-items-center p-8">
      <div className="text-center max-w-md">
        <Icon name="alertTriangle" size={64} className="text-coral-600 mx-auto mb-4" />
        <h1 className="text-4xl font-display font-bold text-ink-900 mb-2">404</h1>
        <p className="text-slate-600 mb-8">
          La página que buscas no existe o fue trasladada.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-brass-500 text-white px-6 py-3 rounded-lg hover:bg-brass-600 transition-colors font-semibold"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
```

### Error Boundary

**`app/error.tsx`:**

```typescript
'use client';

import { useEffect } from 'react';
import { Icon, Button } from '@/components/Primitives';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-paper-100 grid place-items-center p-8">
      <div className="text-center max-w-md">
        <Icon name="alertCircle" size={64} className="text-coral-600 mx-auto mb-4" />
        <h1 className="text-4xl font-display font-bold text-ink-900 mb-2">¡Oops!</h1>
        <p className="text-slate-600 mb-2">
          Algo salió mal. Por favor intenta de nuevo.
        </p>
        <p className="text-xs text-slate-500 mb-8 bg-coral-50 p-4 rounded-lg">
          {error.message}
        </p>
        <Button
          variant="accent"
          onClick={reset}
          className="w-full"
        >
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
```

---

## SEO & Meta Tags

### Root Layout

**`app/layout.tsx`:**

```typescript
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LATAS',
    template: '%s — LATAS',
  },
  description: 'Sistema integral de gestión de ventas y caja',
  keywords: ['ventas', 'caja', 'gestión', 'transacciones'],
  authors: [{ name: 'LATAS' }],
  creator: 'LATAS',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://latas.app',
    title: 'LATAS — Sistema de Gestión',
    description: 'Plataforma moderna para gestión de ventas y caja',
    siteName: 'LATAS',
  },
  robots: {
    index: false, // No indexar (es una app, no un sitio web)
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0e27" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
```

### Meta tags por página

```typescript
// Cada página puede sobrescribir metadata
export const metadata: Metadata = {
  title: 'Registro de Ventas',
  description: 'Formulario para registrar nuevas transacciones',
};

export default function SalesRegisterPage() {
  // ...
}
```

---

## Transiciones entre páginas

### Page Transitions

**`components/PageTransition.tsx`:**

```typescript
'use client';

import { ReactNode } from 'react';

export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
};
```

### Uso en páginas

```typescript
import { PageTransition } from '@/components/PageTransition';

export default function Page() {
  return (
    <PageTransition>
      {/* Contenido */}
    </PageTransition>
  );
}
```

---

## Checklist

- [ ] Carpetas `(auth)` y `(dashboard)` creadas con layouts separados
- [ ] App Router navegación funcional entre todas las rutas
- [ ] Sidebar desktop visible en ≥1024px
- [ ] Mobile drawer navegación en <1024px
- [ ] Breadcrumbs generados dinámicamente
- [ ] Página 404 con estilo Axentria
- [ ] Error boundary funcionando
- [ ] Meta tags en root layout
- [ ] Meta tags específicos por página
- [ ] Transiciones de página suaves
- [ ] Responsive design probado en 360/768/1024/1280px
- [ ] Links internos usando `href` (no `<Link>`)
- [ ] Logout redirige correctamente a login
- [ ] Role-based navigation (admin vs cashier)

---

**Estado:** ✅ Phase 7 Complete  
**Duración estimada:** 1.5-2 horas  
**Siguiente:** Phase 8 - Deployment & Production
