/* Shell — Sidebar + TopBar that hosts the app screens. */
const { useState } = React;

const NAV = [
  { id: "dashboard",     icon: "chart",      label: "Panel de Control" },
  { id: "sale",          icon: "plus",       label: "Registro de Venta" },
  { id: "transactions",  icon: "receipt",    label: "Transacciones", meta: "1.024" },
  { id: "cash",          icon: "cash",       label: "Gestión de Caja", dot: "sage" },
  { id: "reports",       icon: "list",       label: "Informes" },
  { id: "admin",         icon: "users",      label: "Administración" },
];

const Sidebar = ({ active, onNavigate, onLogout, cashOpen }) => (
  <aside style={{
    width: 256, flexShrink: 0, background: "var(--paper-50)",
    borderRight: "1px solid var(--border-default)",
    display: "flex", flexDirection: "column",
  }}>
    {/* Brand block */}
    <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: "var(--ink-900)",
          display: "grid", placeItems: "center", boxShadow: "var(--elev-2)",
          padding: 8
        }}>
          <img src="assets/logo-axentria-mark.svg" alt="Axentria" style={{ width: "100%", height: "100%" }} />
        </div>
        <div>
          <img src="assets/logo-axentria.svg" alt="Axentria" style={{ height: 20, marginBottom: 2 }} />
          <div className="ovl" style={{ fontSize: 9, color: "var(--slate-500)", opacity: 0.8 }}>SISTEMA DE VENTAS</div>
        </div>
      </div>
    </div>

    {/* Cash status banner */}
    <div style={{ padding: "16px 16px 8px" }}>
      <div onClick={() => onNavigate("cash")} style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px", borderRadius: 12,
        background: cashOpen ? "var(--sage-50)" : "var(--paper-200)",
        border: `1px solid ${cashOpen ? "color-mix(in oklab, var(--sage-500) 25%, transparent)" : "var(--border-default)"}`,
        cursor: "pointer", transition: "all var(--dur-2)"
      }} className="lift">
        <div style={{ position: "relative" }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: cashOpen ? "var(--sage-500)" : "var(--slate-400)",
          }}/>
          {cashOpen && (
            <div style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              background: "var(--sage-500)", opacity: 0.25,
              animation: "pulse 2s infinite"
            }}/>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--slate-500)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Caja del día</div>
          <div style={{ fontSize: 14, color: "var(--ink-900)", fontWeight: 700 }}>{cashOpen ? "Abierta · 08:14" : "Cerrada"}</div>
        </div>
        <Icon name="chevronRight" size={14} style={{ color: "var(--slate-400)" }}/>
      </div>
    </div>

    {/* Nav items */}
    <nav style={{ flex: 1, overflow: "auto", padding: "10px 12px 16px" }}>
      <div className="ovl" style={{ padding: "12px 8px", fontSize: 10 }}>Operación</div>
      {NAV.slice(0,5).map(it => (
        <NavItem key={it.id} item={it} active={it.id === active} onClick={() => onNavigate(it.id)} />
      ))}
      <div className="ovl" style={{ padding: "20px 8px 8px", fontSize: 10 }}>Sistema</div>
      {NAV.slice(5).map(it => (
        <NavItem key={it.id} item={it} active={it.id === active} onClick={() => onNavigate(it.id)} />
      ))}
    </nav>

    {/* User block */}
    <div style={{ padding: 16, borderTop: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name="Maria Gonzalez" size={36} tone="brass"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Maria Gonzalez</div>
          <div style={{ fontSize: 11, color: "var(--slate-500)" }}>Cajera · ID 4920</div>
        </div>
        <button title="Cerrar sesión" onClick={onLogout}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-default)",
                   background: "#fff", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--slate-600)", transition: "all 0.2s" }}
          className="lift">
          <Icon name="logout" size={14}/>
        </button>
      </div>
    </div>
    <style>{`
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }
    `}</style>
  </aside>
);

const NavItem = ({ item, active, onClick }) => (
  <div className="nav-item" data-active={active} onClick={onClick}>
    <Icon name={item.icon} size={16}/>
    <span>{item.label}</span>
    {item.meta ? <span className="nav-meta">{item.meta}</span> : null}
    {item.dot ? <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
                               background: item.dot === "sage" ? "var(--sage-500)" : "var(--coral-500)" }}/> : null}
  </div>
);

const TopBar = ({ title, subtitle, eyebrow, actions }) => (
  <header style={{
    height: 76, padding: "0 32px", borderBottom: "1px solid var(--border-default)",
    background: "var(--paper-50)", display: "flex", alignItems: "center", flexShrink: 0,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      {eyebrow ? <div className="ovl" style={{ marginBottom: 2 }}>{eyebrow}</div> : null}
      <h1 className="display" style={{ fontSize: 30, lineHeight: 1, color: "var(--ink-900)", margin: 0 }}>{title}</h1>
      {subtitle ? <div style={{ marginTop: 4, fontSize: 13, color: "var(--slate-500)" }}>{subtitle}</div> : null}
    </div>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <button title="Buscar" style={topIconBtn}><Icon name="search" size={16}/></button>
      <button title="Notificaciones" style={topIconBtn}>
        <Icon name="bell" size={16}/>
        <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "var(--coral-500)" }}/>
      </button>
      <button title="Ayuda" style={topIconBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".5" fill="currentColor"/>
        </svg>
      </button>
      <button title="Ajustes" style={topIconBtn}><Icon name="settings" size={16}/></button>
      {actions ? <div style={{ marginLeft: 8 }}>{actions}</div> : null}
    </div>
  </header>
);

const topIconBtn = {
  position: "relative", width: 38, height: 38, borderRadius: 8,
  border: "1px solid var(--border-default)", background: "#fff",
  color: "var(--slate-700)", cursor: "pointer", display: "grid", placeItems: "center",
};

Object.assign(window, { Sidebar, TopBar, NAV });
