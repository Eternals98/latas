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
        <div className="flex items-center justify-between p-4 border-b border-ink-800">
          <div className="text-xl font-bold">LATAS</div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded text-paper-50 hover:bg-ink-800"
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