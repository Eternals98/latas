'use client';

import React, { useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Plus, Minus, Check, X,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  Search, Bell, User, Users, Home, BarChart3, List, Box,
  DollarSign, Receipt, RotateCcw, Settings, LogOut, Calendar, Trash2, Printer,
  ArrowUp, ArrowDown, Eye, MoreHorizontal, Download, Filter, CreditCard, Building2, HelpCircle, Info, AlertTriangle, Copy, Activity, Clipboard,
  LucideIcon,
} from 'lucide-react';

/** Utility for merging tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Icon wrapper for Lucide icons -------------------------
const ICON_MAP: { [key: string]: React.ComponentType<{ size: number; strokeWidth: number; className?: string }> } = {
  plus: Plus,
  minus: Minus,
  check: Check,
  x: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  search: Search,
  bell: Bell,
  user: User,
  users: Users,
  home: Home,
  chart: BarChart3,
  list: List,
  box: Box,
  cash: DollarSign,
  receipt: Receipt,
  return: RotateCcw,
  settings: Settings,
  logout: LogOut,
  calendar: Calendar,
  trash: Trash2,
  print: Printer,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  eye: Eye,
  moreH: MoreHorizontal,
  download: Download,
  filter: Filter,
  creditCard: CreditCard,
  bank: Building2,
  help: HelpCircle,
  info: Info,
  alert: AlertTriangle,
  copy: Copy,
  activity: Activity,
  clipboard: Clipboard,
};

export const Icon = ({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
  ...rest
}: {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
  [key: string]: any
}) => {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return null;

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={cn("inline-block", className)}
      {...rest}
    />
  );
};

// --- Brand Components ---------------------------------------------------
export const BrandMark = ({
  size = 24,
  color = "currentColor",
  className,
  ...rest
}: {
  size?: number
  color?: string
  className?: string
  [key: string]: any
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill={color} />
    <path d="M12 6l-6 3.5v5L12 18l6-3.5v-5L12 6z" fill="white" fillOpacity="0.2" />
    <path d="M12 22V12M12 12l9-5M12 12L3 7" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
  </svg>
);

export const BrandLogo = ({
  height = 24,
  color = "currentColor",
  className,
  ...rest
}: {
  height?: number
  color?: string
  className?: string
  [key: string]: any
}) => (
  <svg height={height} viewBox="0 0 120 24" fill="none" className={className} {...rest}>
    <text x="0" y="20" fontFamily="var(--font-display)" fontSize="20" fontWeight="700" fill={color}>AXENTRIA</text>
  </svg>
);

// --- Button ---------------------------------------------------------------
export const Button = ({
  variant = "primary",
  size = "md",
  icon,
  children,
  onClick,
  disabled,
  type = "button",
  className,
  ...rest
}: {
  variant?: 'primary' | 'accent' | 'ghost' | 'text' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
  [key: string]: any
}) => {
  const variantClasses = {
    primary: "bg-ink-900 text-paper-50 border-ink-900 hover:bg-ink-800",
    accent:  "bg-brass-400 text-ink-900 border-brass-400 hover:bg-brass-500",
    ghost:   "bg-transparent text-ink-900 border-slate-200 hover:bg-paper-100",
    text:    "bg-transparent text-ink-900 border-transparent hover:text-brass-600",
    danger:  "bg-coral-500 text-white border-coral-500 hover:bg-coral-600",
  };
  const sizeClasses = {
    sm: "py-1.5 px-2.5 text-xs gap-1.5 rounded-sm",
    md: "py-2.5 px-3.5 text-sm gap-2 rounded-sm",
    lg: "py-3 px-4.5 text-base gap-2.5 rounded-md",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center font-sans font-semibold leading-none border transition-all duration-200 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:translate-y-px",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
    </button>
  );
};

// --- Input -----------------------------------------------------------------
export const Input = ({
  label,
  hint,
  error,
  prefix,
  type = "text",
  value,
  onChange,
  placeholder,
  mono,
  className,
  ...rest
}: {
  label?: string
  hint?: string
  error?: string | boolean
  prefix?: React.ReactNode
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  mono?: boolean
  className?: string
  [key: string]: any
}) => {
  const id = useRef(`in-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={id} className="text-xs font-semibold text-ink-900">{label}</label>}
      {prefix ? (
        <div className={cn(
          "flex items-stretch rounded-sm border bg-white overflow-hidden transition-all",
          error ? "border-coral-500" : "border-slate-200 focus-within:border-brass-400 focus-within:ring-2 focus-within:ring-brass-400/25"
        )}>
          <span className="px-3 py-2.5 bg-paper-200 text-slate-700 font-mono text-sm border-r border-slate-200 flex items-center">{prefix}</span>
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={cn(
              "flex-1 px-3 py-2.5 outline-none text-sm text-ink-900 bg-transparent",
              mono ? "font-mono tabular-nums" : "font-sans"
            )}
            {...rest}
          />
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "px-3 py-2.5 rounded-sm bg-white border text-sm text-ink-900 outline-none transition-all",
            error ? "border-coral-500 ring-2 ring-coral-500/25" : "border-slate-200 focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25",
            mono ? "font-mono tabular-nums" : "font-sans"
          )}
          {...rest}
        />
      )}
      {(hint || error) && (
        <span className={cn("text-[11px]", error ? "text-coral-600" : "text-slate-500")}>
          {error || hint}
        </span>
      )}
    </div>
  );
};

// --- Badge -----------------------------------------------------------------
export const Badge = ({
  tone = "neutral",
  dot = true,
  children,
  className
}: {
  tone?: 'success' | 'danger' | 'warn' | 'info' | 'neutral'
  dot?: boolean
  children: React.ReactNode
  className?: string
}) => {
  const toneClasses = {
    success: "bg-sage-50 text-sage-700",
    danger:  "bg-coral-50 text-coral-700",
    warn:    "bg-brass-50 text-brass-700",
    info:    "bg-paper-200 text-ink-800",
    neutral: "bg-slate-100 text-slate-700",
  };
  const dotClasses = {
    success: "bg-sage-500",
    danger:  "bg-coral-500",
    warn:    "bg-brass-400",
    info:    "bg-ink-700",
    neutral: "bg-slate-500",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold leading-tight",
      toneClasses[tone],
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotClasses[tone])}/>}
      {children}
    </span>
  );
};

// --- Card ------------------------------------------------------------------
export const Card = ({
  variant = "default",
  padding = 16,
  children,
  className,
  ...rest
}: {
  variant?: 'default' | 'ledger' | 'inverse' | 'sunken'
  padding?: number
  children: React.ReactNode
  className?: string
  [key: string]: any
}) => {
  const variantClasses = {
    default: "bg-white border-slate-200 shadow-1",
    ledger:  "bg-white border-slate-200 border-l-[3px] border-l-brass-400 shadow-1",
    inverse: "bg-ink-900 text-paper-50 border-ink-900",
    sunken:  "bg-paper-200 border-slate-200",
  };

  return (
    <div
      className={cn(
        "rounded-md border",
        variantClasses[variant],
        className
      )}
      style={{ padding }}
      {...rest}
    >
      {children}
    </div>
  );
};

// --- Avatar ----------------------------------------------------------------
export const Avatar = ({
  name = "?",
  size = 28,
  tone = "brass",
  className
}: {
  name?: string
  size?: number
  tone?: 'brass' | 'sage' | 'coral' | 'ink'
  className?: string
}) => {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const toneClasses = {
    brass: "bg-brass-100 text-brass-700",
    sage:  "bg-sage-100 text-sage-700",
    coral: "bg-coral-100 text-coral-700",
    ink:   "bg-ink-900 text-paper-50",
  };

  return (
    <span
      className={cn(
        "rounded-full inline-grid place-items-center font-sans font-bold",
        toneClasses[tone],
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
};

// --- Money formatter -------------------------------------------------------
export const fmtMoney = (n: number, opts: { alwaysSign?: boolean } = {}) => {
  const sign = n < 0 ? "− " : opts.alwaysSign ? "+ " : "";
  const abs = Math.abs(Math.round(n));
  const grouped = abs.toLocaleString("es-CL");
  return `${sign}$${grouped}`;
};
