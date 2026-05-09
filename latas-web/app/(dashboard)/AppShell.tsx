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
              className="ml-auto text-paper-50 hover:bg-ink-800"
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
        <div className="p-4 space-y-3 border-t border-ink-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="justify-start w-full text-paper-50 hover:bg-ink-800"
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
        <div className="flex items-center justify-between p-4 border-b border-ink-800">
          <div className="text-xl font-bold font-display">LATAS</div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-2 rounded text-paper-50 hover:bg-ink-800"
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
            className="justify-start w-full text-paper-50 hover:bg-ink-800"
            icon="logOut"
          >
            Salir
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 lg:px-8">
          <Button
            variant="text"
            size="sm"
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden text-ink-900"
            icon="menu"
          />
          <div className="items-center hidden gap-6 ml-auto lg:flex">
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