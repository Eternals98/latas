'use client';

import React from 'react';
import { Icon, Avatar, BrandMark, BrandLogo, cn } from './Primitives';

const NAV = [
  { id: "dashboard",     icon: "chart",      label: "Panel de Control" },
  { id: "sale",          icon: "plus",       label: "Registro de Venta" },
  { id: "transactions",  icon: "receipt",    label: "Transacciones", meta: "1.024" },
  { id: "cash",          icon: "cash",       label: "Gestión de Caja", dot: "sage" },
  { id: "reports",       icon: "list",       label: "Informes" },
  { id: "admin",         icon: "users",      label: "Administración" },
];

export const Sidebar = ({ active, onNavigate, onLogout, cashOpen }: { active: string, onNavigate: (id: string) => void, onLogout: () => void, cashOpen: boolean }) => (
  <aside className="w-64 flex-shrink-0 bg-paper-50 border-r border-slate-200 flex flex-col">
    {/* Brand block */}
    <div className="p-6 pb-5 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10.5 h-10.5 rounded-xl bg-ink-900 grid place-items-center shadow-elev-2 p-2">
          <BrandMark color="var(--paper-50)" size={24} />
        </div>
        <div>
          <BrandLogo height={20} color="var(--ink-900)" />
          <div className="text-[9px] tracking-overline uppercase font-bold text-slate-500 opacity-80 mt-0.5">SISTEMA DE VENTAS</div>
        </div>
      </div>
    </div>

    {/* Cash status banner */}
    <div className="p-4 pb-2">
      <div 
        onClick={() => onNavigate("cash")} 
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-elev-1",
          cashOpen ? "bg-sage-50 border-sage-500/25" : "bg-paper-200 border-slate-200"
        )}
      >
        <div className="relative">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            cashOpen ? "bg-sage-500" : "bg-slate-400"
          )}/>
          {cashOpen && (
            <div className="absolute -inset-1 rounded-full bg-sage-500 opacity-25 animate-ping duration-[2000ms]" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[10px] tracking-overline uppercase font-bold text-slate-500">Caja del día</div>
          <div className="text-sm text-ink-900 font-bold">{cashOpen ? "Abierta · 08:14" : "Cerrada"}</div>
        </div>
        <Icon name="chevronRight" size={14} className="text-slate-400" />
      </div>
    </div>

    {/* Nav items */}
    <nav className="flex-1 overflow-auto p-2.5 pb-4 custom-scrollbar">
      <div className="text-[10px] tracking-overline uppercase font-bold text-slate-500 px-2 py-3">Operación</div>
      <div className="flex flex-col gap-0.5">
        {NAV.slice(0,5).map(it => (
          <NavItem key={it.id} item={it} active={it.id === active} onClick={() => onNavigate(it.id)} />
        ))}
      </div>
      
      <div className="text-[10px] tracking-overline uppercase font-bold text-slate-500 px-2 pt-5 pb-2">Sistema</div>
      <div className="flex flex-col gap-0.5">
        {NAV.slice(5).map(it => (
          <NavItem key={it.id} item={it} active={it.id === active} onClick={() => onNavigate(it.id)} />
        ))}
      </div>
    </nav>

    {/* User block */}
    <div className="p-4 border-t border-slate-200 bg-paper-100/50">
      <div className="flex items-center gap-3">
        <Avatar name="Maria Gonzalez" size={36} tone="brass"/>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-ink-900 truncate">Maria Gonzalez</div>
          <div className="text-[11px] text-slate-500 font-medium">Cajera · ID 4920</div>
        </div>
        <button 
          title="Cerrar sesión" 
          onClick={onLogout}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white grid place-items-center cursor-pointer text-slate-600 hover:text-ink-900 hover:border-slate-300 transition-all shadow-sm active:scale-95"
        >
          <Icon name="logout" size={14}/>
        </button>
      </div>
    </div>
  </aside>
);

const NavItem = ({ item, active, onClick }: { item: any, active: boolean, onClick: () => void }) => (
  <div 
    className={cn(
      "flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
      active 
        ? "bg-ink-900 text-paper-50 font-bold" 
        : "text-ink-900 hover:bg-paper-200"
    )}
    onClick={onClick}
  >
    <Icon name={item.icon} size={16} />
    <span className="flex-1">{item.label}</span>
    {item.meta && (
      <span className={cn(
        "font-mono text-[11px] tabular-nums",
        active ? "text-brass-300" : "text-slate-500"
      )}>
        {item.meta}
      </span>
    )}
    {item.dot && !item.meta && (
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        item.dot === "sage" ? "bg-sage-500" : "bg-coral-500"
      )}/>
    )}
  </div>
);

export const TopBar = ({ title, subtitle, eyebrow, actions }: { title: string, subtitle?: string, eyebrow?: string, actions?: React.ReactNode }) => (
  <header className="h-[76px] px-8 border-b border-slate-200 bg-paper-50 flex items-center flex-shrink-0">
    <div className="flex-1 min-w-0">
      {eyebrow && <div className="text-[11px] tracking-overline uppercase font-bold text-slate-500 mb-0.5">{eyebrow}</div>}
      <h1 className="font-display text-3xl leading-none text-ink-900 m-0 truncate">{title}</h1>
      {subtitle && <div className="mt-1 text-sm text-slate-500 font-medium">{subtitle}</div>}
    </div>
    <div className="flex gap-2.5 items-center">
      <TopIconBtn title="Buscar"><Icon name="search" size={16}/></TopIconBtn>
      <TopIconBtn title="Notificaciones">
        <Icon name="bell" size={16}/>
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-coral-500 ring-2 ring-white" />
      </TopIconBtn>
      <TopIconBtn title="Ayuda">
        <Icon name="help" size={16}/>
      </TopIconBtn>
      <TopIconBtn title="Ajustes"><Icon name="settings" size={16}/></TopIconBtn>
      {actions && <div className="ml-2">{actions}</div>}
    </div>
  </header>
);

const TopIconBtn = ({ children, title, className, ...props }: any) => (
  <button 
    title={title} 
    className={cn(
      "relative w-9.5 h-9.5 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer grid place-items-center transition-all hover:bg-paper-50 hover:border-slate-300 shadow-sm active:scale-95",
      className
    )}
    {...props}
  >
    {children}
  </button>
);
