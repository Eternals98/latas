'use client';

import React, { useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for merging tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Icons (SVG Implementation) -------------------------
export const Icon = ({ name, size = 16, strokeWidth = 1.75, className, ...rest }: { name: string, size?: number, strokeWidth?: number, className?: string, [key: string]: any }) => {
  const paths: { [key: string]: string } = {
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    check: "M5 12l5 5L20 7",
    x: "M6 6l12 12M6 18L18 6",
    chevronDown: "M6 9l6 6 6-6",
    chevronUp: "M18 15l-6-6-6 6",
    chevronRight: "M9 6l6 6-6 6",
    chevronLeft: "M15 6l-6 6 6 6",
    search: "M11 19a8 8 0 110-16 8 8 0 010 16zM21 21l-4.3-4.3",
    bell: "M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 004 0",
    user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    users: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
    home: "M3 11l9-8 9 8v10a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2z",
    chart: "M3 3v18h18 M7 14l4-4 4 4 5-7",
    list: "M3 6h18 M3 12h18 M3 18h12",
    box: "M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10",
    cash: "M3 6h18v12H3z M3 10h18 M7 14h.01 M12 14h2",
    receipt: "M4 2h16v20l-4-2-4 2-4 2-4-2-4 2z M9 8h6 M9 12h6 M9 16h4",
    return: "M21 12a9 9 0 11-3-6.7L21 8 M21 3v5h-5",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
    calendar: "M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2z M3 10h18 M8 2v4 M16 2v4",
    trash: "M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
    print: "M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6z",
    arrowUp: "M12 19V5 M5 12l7-7 7 7",
    arrowDown: "M12 5v14 M5 12l7 7 7-7",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
    moreH: "M5 12h.01M12 12h.01M19 12h.01",
    download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    filter: "M3 4h18l-7 9v7l-4-2v-5z",
    creditCard: "M1 10h22 M1 18h22 M1 6a2 2 0 012-2h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6z",
    bank: "M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M11 10v11 M15 10v11 M20 10v11",
    help: "M12 12a9 9 0 110-18 9 9 0 010 18z M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01",
    info: "M12 16V12 M12 8h.01 M12 21a9 9 0 110-18 9 9 0 010 18z",
    alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
    copy: "M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.24a2 2 0 00-.59-1.42l-2.24-2.24A2 2 0 0015.76 3H10a2 2 0 00-2 2z M16 3v5h5 M4 8v11a2 2 0 002 2h10",
    activity: "M22 12h-4l-3 9L9 3l-3 9H2",
    clipboard: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2 M9 2h6v4H9z",
  };
  const d = paths[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={cn("inline-block", className)} {...rest}>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? "" : "M") + seg} />
      ))}
    </svg>
  );
};

// --- Brand Components ------------------------------------------------------------
export const BrandMark = ({ size = 24, color = "currentColor", className, ...rest }: { size?: number, color?: string, className?: string, [key: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill={color} />
    <path d="M12 6l-6 3.5v5L12 18l6-3.5v-5L12 6z" fill="white" fillOpacity="0.2" />
    <path d="M12 22V12M12 12l9-5M12 12L3 7" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
  </svg>
);

export const BrandLogo = ({ height = 24, color = "currentColor", className, ...rest }: { height?: number, color?: string, className?: string, [key: string]: any }) => (
  <svg height={height} viewBox="0 0 120 24" fill="none" className={className} {...rest}>
    <text x="0" y="20" fontFamily="var(--font-display)" fontSize="20" fontWeight="700" fill={color}>AXENTRIA</text>
  </svg>
);

// --- Button -----------------------------------------------------------------
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
  variant?: 'primary' | 'accent' | 'ghost' | 'text' | 'danger', 
  size?: 'sm' | 'md' | 'lg', 
  icon?: string, 
  children?: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean, 
  type?: "button" | "submit" | "reset", 
  className?: string,
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

// --- Input ------------------------------------------------------------------
export const Input = ({ label, hint, error, prefix, type = "text", value, onChange, placeholder, mono, className, ...rest }: { label?: string, hint?: string, error?: string | boolean, prefix?: React.ReactNode, type?: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, mono?: boolean, className?: string, [key: string]: any }) => {
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

// --- Badge ------------------------------------------------------------------
export const Badge = ({ tone = "neutral", dot = true, children, className }: { tone?: 'success' | 'danger' | 'warn' | 'info' | 'neutral', dot?: boolean, children: React.ReactNode, className?: string }) => {
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

// --- Card -------------------------------------------------------------------
export const Card = ({ variant = "default", padding = 16, children, className, ...rest }: { variant?: 'default' | 'ledger' | 'inverse' | 'sunken', padding?: number, children: React.ReactNode, className?: string, [key: string]: any }) => {
  const variantClasses = {
    default: "bg-white border-slate-200 shadow-elev-1",
    ledger:  "bg-white border-slate-200 border-l-[3px] border-l-brass-400 shadow-elev-1",
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

// --- Avatar -----------------------------------------------------------------
export const Avatar = ({ name = "?", size = 28, tone = "brass", className }: { name?: string, size?: number, tone?: 'brass' | 'sage' | 'coral' | 'ink', className?: string }) => {
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

// --- Money formatter --------------------------------------------------------
export const fmtMoney = (n: number, opts: { alwaysSign?: boolean } = {}) => {
  const sign = n < 0 ? "− " : opts.alwaysSign ? "+ " : "";
  const abs = Math.abs(Math.round(n));
  const grouped = abs.toLocaleString("es-CL");
  return `${sign}$${grouped}`;
};
