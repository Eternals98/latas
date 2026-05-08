'use client';

import React from 'react';
import { Icon, cn } from './Primitives';

export type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  items: Array<{ href: string; label: string; icon: string }>;
};

export const MobileNav = ({ open, onClose, items }: MobileNavProps) => {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500">
              Menú
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-paper-100 rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex flex-col gap-1 px-2">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-ink-900 hover:bg-paper-50 transition-colors focus-visible:ring-2 focus-visible:ring-brass-400 focus-visible:outline-none"
                >
                  <Icon name={item.icon as any} size={18} />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <div className="text-[10px] tracking-overline uppercase font-semibold text-slate-500">
              Versión 4.2.1
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
