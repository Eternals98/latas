'use client';

import React, { useState } from 'react';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button, Avatar } from './Primitives';

export const Shell = ({
  children,
  role = 'cashier',
}: {
  children: ReactNode;
  role?: 'admin' | 'cashier';
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const navItems =
    role === 'admin'
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: 'barChart' },
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

  return (
    <div className="flex h-screen bg-paper-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-ink-900 text-paper-50 flex flex-col`}
      >
        <div className="p-4 border-b border-ink-800">
          <div className="text-xl font-bold">LATAS</div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 transition-colors rounded-lg hover:bg-ink-800"
            >
              <Icon name={item.icon as any} size={20} />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 space-y-3 border-t border-ink-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="justify-start w-full border-paper-50 text-paper-50 hover:bg-ink-800"
          >
            <Icon name="logOut" size={16} />
            {sidebarOpen && 'Salir'}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
          <Button variant="text" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name="list" size={20} />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar initials="JD" size="sm" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};