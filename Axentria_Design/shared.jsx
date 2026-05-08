/* Shared component primitives for the Axentria web UI kit.
   Globally exposed on `window` so other Babel scripts can use them. */

const { useState, useRef, useEffect } = React;

// --- Lucide-style icons (1.75 stroke, currentColor) -------------------------
const Icon = ({ name, size = 16, strokeWidth = 1.75, ...rest }) => {
  const paths = {
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    check: "M5 12l5 5L20 7",
    x: "M6 6l12 12M6 18L18 6",
    chevronDown: "M6 9l6 6 6-6",
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
    receipt: "M4 2h16v20l-4-2-4 2-4-2-4 2z M9 8h6 M9 12h6 M9 16h4",
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
    creditCard: "M3 6h18v12H3z M3 10h18",
  };
  const d = paths[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? "" : "M") + seg} />
      ))}
    </svg>
  );
};

// --- Button -----------------------------------------------------------------
const Button = ({ variant = "primary", size = "md", icon, children, onClick, disabled, type = "button", style, ...rest }) => {
  const variants = {
    primary: { background: "var(--ink-900)", color: "var(--paper-50)", border: "1px solid var(--ink-900)" },
    accent:  { background: "var(--brass-400)", color: "var(--ink-900)", border: "1px solid var(--brass-400)" },
    ghost:   { background: "transparent", color: "var(--ink-900)", border: "1px solid var(--border-default)" },
    text:    { background: "transparent", color: "var(--ink-900)", border: "1px solid transparent" },
    danger:  { background: "var(--coral-500)", color: "white", border: "1px solid var(--coral-500)" },
  };
  const sizes = {
    sm: { padding: "6px 10px", fontSize: 12, borderRadius: 6, gap: 6 },
    md: { padding: "9px 14px", fontSize: 14, borderRadius: 6, gap: 8 },
    lg: { padding: "12px 18px", fontSize: 15, borderRadius: 8, gap: 10 },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className="ax-btn"
      data-variant={variant}
      style={{
        fontFamily: "var(--font-sans)", fontWeight: 600, lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "all 200ms cubic-bezier(.2,.7,.2,1)",
        ...variants[variant], ...sizes[size], ...(style || {})
      }} {...rest}>
      {icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
    </button>
  );
};

// --- Input ------------------------------------------------------------------
const Input = ({ label, hint, error, prefix, type = "text", value, onChange, placeholder, mono, style, ...rest }) => {
  const id = useRef(`in-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label ? <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-900)" }}>{label}</label> : null}
      {prefix ? (
        <div style={{
          display: "flex", alignItems: "stretch",
          borderRadius: 6, border: `1px solid ${error ? "var(--coral-500)" : "var(--border-default)"}`,
          background: "#fff", overflow: "hidden",
        }}>
          <span style={{ padding: "10px 12px", background: "var(--paper-200)", color: "var(--slate-700)",
                         fontFamily: "var(--font-mono)", fontSize: 14, borderRight: "1px solid var(--border-default)" }}>{prefix}</span>
          <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
                 style={{ border: 0, flex: 1, padding: "10px 12px", outline: "none", fontSize: 14,
                          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
                          fontVariantNumeric: mono ? "tabular-nums" : "normal" }}  {...rest}/>
        </div>
      ) : (
        <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: 14,
                   padding: "10px 12px", borderRadius: 6, background: "#fff",
                   border: `1px solid ${error ? "var(--coral-500)" : "var(--border-default)"}`,
                   color: "var(--ink-900)", outline: "none",
                   boxShadow: error ? "0 0 0 3px color-mix(in oklab, var(--coral-500) 25%, transparent)" : "none",
                   transition: "all 150ms" }} {...rest}/>
      )}
      {hint || error ? (
        <span style={{ fontSize: 11, color: error ? "var(--coral-600)" : "var(--slate-500)" }}>{error || hint}</span>
      ) : null}
    </div>
  );
};

// --- Badge ------------------------------------------------------------------
const Badge = ({ tone = "neutral", dot = true, children }) => {
  const tones = {
    success: { bg: "var(--sage-50)",   fg: "var(--sage-700)",   dotBg: "var(--sage-500)" },
    danger:  { bg: "var(--coral-50)",  fg: "var(--coral-700)",  dotBg: "var(--coral-500)" },
    warn:    { bg: "var(--brass-50)",  fg: "var(--brass-700)",  dotBg: "var(--brass-400)" },
    info:    { bg: "var(--paper-200)", fg: "var(--ink-800)",    dotBg: "var(--ink-700)" },
    neutral: { bg: "var(--slate-100)", fg: "var(--slate-700)",  dotBg: "var(--slate-500)" },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: t.bg, color: t.fg,
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, lineHeight: 1.4,
    }}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dotBg }}/> : null}
      {children}
    </span>
  );
};

// --- Card -------------------------------------------------------------------
const Card = ({ variant = "default", padding = 16, children, style, ...rest }) => {
  const variants = {
    default: { background: "#fff", border: "1px solid var(--border-default)", boxShadow: "var(--elev-1)" },
    ledger:  { background: "#fff", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--brass-400)", boxShadow: "var(--elev-1)" },
    inverse: { background: "var(--ink-900)", color: "var(--paper-50)", border: "1px solid var(--ink-900)" },
    sunken:  { background: "var(--paper-200)", border: "1px solid var(--border-default)" },
  };
  return (
    <div style={{ borderRadius: 10, padding, ...variants[variant], ...(style || {}) }} {...rest}>{children}</div>
  );
};

// --- Avatar -----------------------------------------------------------------
const Avatar = ({ name = "?", size = 28, tone = "brass" }) => {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const tones = {
    brass: { bg: "var(--brass-100)", fg: "var(--brass-700)" },
    sage:  { bg: "var(--sage-100)",  fg: "var(--sage-700)"  },
    coral: { bg: "var(--coral-100)", fg: "var(--coral-700)" },
    ink:   { bg: "var(--ink-900)",   fg: "var(--paper-50)"  },
  };
  const t = tones[tone];
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: t.bg, color: t.fg,
                   display: "inline-grid", placeItems: "center",
                   fontSize: size * 0.42, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
      {initials}
    </span>
  );
};

// --- Money formatter --------------------------------------------------------
const fmtMoney = (n, opts = {}) => {
  const sign = n < 0 ? "− " : opts.alwaysSign ? "+ " : "";
  const abs = Math.abs(Math.round(n));
  const grouped = abs.toLocaleString("es-CL");
  return `${sign}$${grouped}`;
};

Object.assign(window, { Icon, Button, Input, Badge, Card, Avatar, fmtMoney });
