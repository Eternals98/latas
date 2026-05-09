'use client';

import React, { useId, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Plus, Minus, Check, X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  Search, Bell, User, Users, Home, BarChart3, List, Box, DollarSign, 
  Receipt, RotateCcw, Settings, LogOut, Calendar, Trash2, Printer,
  ArrowUp, ArrowDown, Eye, MoreHorizontal, Download, Filter, CreditCard,
  Building2, HelpCircle, Info, AlertTriangle, Copy, Activity, Clipboard,
  LucideIcon,
} from 'lucide-react';

/**
 * Utility for merging Tailwind classes
 * Prevents class conflicts (e.g., mt-4 overriding mt-2)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// ICON COMPONENT
// ============================================================================

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
  barChart: BarChart3,
  list: List,
  box: Box,
  dollarSign: DollarSign,
  receipt: Receipt,
  rotateCcw: RotateCcw,
  settings: Settings,
  logOut: LogOut,
  calendar: Calendar,
  trash: Trash2,
  printer: Printer,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  eye: Eye,
  moreHorizontal: MoreHorizontal,
  download: Download,
  filter: Filter,
  creditCard: CreditCard,
  building: Building2,
  helpCircle: HelpCircle,
  info: Info,
  alertTriangle: AlertTriangle,
  copy: Copy,
  activity: Activity,
  clipboard: Clipboard,
};

export type IconName = keyof typeof ICON_MAP;

export const Icon = ({
  name,
  size = 24,
  className,
  ...props
}: {
  name: IconName;
  size?: number;
  className?: string;
  [key: string]: any;
}) => {
  const LucideIcon = ICON_MAP[name];
  if (!LucideIcon) return null;
  return (
    <LucideIcon
      size={size}
      strokeWidth={1.5}
      className={cn('text-current', className)}
      {...props}
    />
  );
};

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconName;
    children?: React.ReactNode;
  }
>(({ variant = 'primary', size = 'md', icon, children, className, ...props }, ref) => {
  const variants = {
    primary: 'bg-ink-900 text-paper-50 hover:bg-ink-800 active:bg-ink-700',
    accent: 'bg-brass-400 text-ink-900 hover:bg-brass-500 active:bg-brass-600',
    ghost: 'bg-transparent text-ink-900 border border-slate-200 hover:bg-slate-50',
    text: 'bg-transparent text-ink-900 hover:text-brass-600 active:text-brass-700',
    danger: 'bg-coral-500 text-white hover:bg-coral-600 active:bg-coral-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm font-medium rounded-sm',
    md: 'px-4 py-2.5 text-base font-medium rounded-md',
    lg: 'h-14 px-6 py-3 text-base font-semibold rounded-lg',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brass-400/50 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    className?: string;
  }
>(({ label, error, prefix, suffix, className, id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-ink-900">
          {label}
        </label>
      )}
      <div className={cn(
        'flex items-stretch rounded-sm border bg-white overflow-hidden transition-all',
        'border-slate-200 focus-within:border-brass-400 focus-within:ring-2 focus-within:ring-brass-400/25',
        error && 'border-coral-500 focus-within:border-coral-500 focus-within:ring-coral-400/25'
      )}>
        {prefix && <span className="flex items-center px-3 text-slate-400">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          className="flex-1 px-3 py-2.5 outline-none text-sm text-ink-900 bg-transparent font-sans placeholder:text-slate-400"
          {...props}
        />
        {suffix && <span className="flex items-center px-3 text-slate-400">{suffix}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-coral-600">
          <Icon name="alertTriangle" size={14} />
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ============================================================================
// CARD COMPONENT
// ============================================================================

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'inverse';
    padding?: 'none' | 'sm' | 'md' | 'lg';
  }
>(({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variants = {
    default: 'bg-white border border-slate-200',
    inverse: 'bg-ink-900 border border-ink-800',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg shadow-1 transition-shadow hover:shadow-2',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export const Badge = ({
  children,
  variant = 'default',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-sage-50 text-sage-700',
    warning: 'bg-brass-50 text-brass-700',
    error: 'bg-coral-50 text-coral-700',
    info: 'bg-slate-100 text-ink-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

export const Avatar = ({
  src,
  alt,
  initials,
  size = 'md',
  className,
}: {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brass-100 text-brass-700 font-semibold flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="object-cover w-full h-full rounded-full" />
      ) : (
        initials
      )}
    </div>
  );
};

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

export const Divider = ({
  orientation = 'horizontal',
  className,
}: {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'bg-slate-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
    />
  );
};

// ============================================================================
// SELECT COMPONENT
// ============================================================================

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: Array<{ value: string; label: string }>;
    error?: string;
    prefix?: React.ReactNode;
  }
>(({ label, options, error, prefix, className, id, ...props }, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-ink-900">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-3 py-2.5 pr-10 rounded-sm border bg-white outline-none text-sm appearance-none font-sans',
            'border-slate-200 focus:border-brass-400 focus:ring-2 focus:ring-brass-400/25 transition-all',
            error && 'border-coral-500 focus:border-coral-500 focus:ring-coral-400/25'
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute top-2.5 right-3 pointer-events-none text-slate-400">
          <Icon name="chevronDown" size={16} />
        </span>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-coral-600">
          <Icon name="alertTriangle" size={14} />
          {error}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtMoney = (amount: number | string): string => {
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? '$0' : COP_FORMATTER.format(parsed);
  }
  return COP_FORMATTER.format(amount);
};

export const fmtDecimal = (num: number | string): string => {
  if (typeof num === 'string') {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? '0.00' : DECIMAL_FORMATTER.format(parsed);
  }
  return DECIMAL_FORMATTER.format(num);
};

export const fmtDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// ============================================================================
// BRAND COMPONENTS (Logo, BrandMark)
// ============================================================================

export const BrandMark = ({ color = 'currentColor', size = 48 }: { color?: string; size?: number }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
    {/* Simple geometric mark based on Axentria brand */}
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <rect x="28" y="8" width="12" height="12" rx="2" />
    <rect x="8" y="28" width="12" height="12" rx="2" />
    <rect x="28" y="28" width="12" height="12" rx="2" />
  </svg>
);

export const BrandLogo = ({ height = 32, color = 'currentColor', className = '' }: { height?: number; color?: string; className?: string }) => (
  <svg
    viewBox="0 0 240 48"
    height={height}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <text x="0" y="36" fontSize="32" fontWeight="700" fontFamily="Instrument Serif" fill={color}>
      LATAS
    </text>
  </svg>
);

// Export all for convenient imports
export default {
  cn,
  Icon,
  Button,
  Input,
  Card,
  Badge,
  Avatar,
  Divider,
  Select,
  fmtMoney,
  fmtDecimal,
  fmtDate,
  BrandMark,
  BrandLogo,
};
