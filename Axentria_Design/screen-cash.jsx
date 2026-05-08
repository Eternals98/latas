/* Gestión de Caja — Caja Diaria. */
const { useState: useStateCash } = React;

const MOVES = [
  { time: "10:45:12", type: "venta",    desc: "Pago Factura #8992",         ref: "TX-4091", amount:   450, balance: 14250 },
  { time: "10:12:05", type: "retiro",   desc: "Traslado a Bóveda Principal",ref: "VB-102",  amount: -2000, balance: 13800 },
  { time: "09:30:44", type: "venta",    desc: "Pago Factura #8991",         ref: "TX-4090", amount:  1200, balance: 15800 },
  { time: "09:05:11", type: "venta",    desc: "Mostrador · Genérico",       ref: "TX-4089", amount:   320, balance: 14600 },
  { time: "08:55:00", type: "ingreso",  desc: "Vuelto manual",              ref: "ADJ-007", amount:    80, balance: 14280 },
  { time: "08:15:00", type: "apertura", desc: "Fondo de caja asignado",     ref: "SYS-INIT",amount:  null, balance:  5000 },
];

const moveBadge = (t) => {
  if (t === "venta")    return <Badge tone="success" dot={false}><Icon name="cash" size={11}/> &nbsp;Venta</Badge>;
  if (t === "retiro")   return <Badge tone="info"    dot={false}><Icon name="box"  size={11}/> &nbsp;Retiro</Badge>;
  if (t === "ingreso")  return <Badge tone="warn"    dot={false}><Icon name="arrowUp" size={11}/> &nbsp;Ingreso</Badge>;
  if (t === "apertura") return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px",
                                              borderRadius: 999, background: "var(--ink-900)", color: "var(--paper-50)",
                                              fontSize: 11, fontWeight: 600 }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
    Apertura</span>;
  return <Badge>{t}</Badge>;
};

const CashScreen = ({ cashOpen, openCash, closeCash }) => {
  const [date, setDate] = useStateCash("8 may 2026");

  return (
    <div style={{ padding: "32px 32px 100px", maxWidth: 1400, margin: "0 auto" }} className="fade-in">
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button className="lift" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "12px 16px", background: "#fff", border: "1px solid var(--border-default)",
          borderRadius: 12, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)", cursor: "pointer"
        }}>
          <Icon name="calendar" size={16}/> {date}
          <Icon name="chevronDown" size={14} style={{ color: "var(--slate-400)" }}/>
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          {!cashOpen ? (
            <Button variant="accent" onClick={openCash} icon="cash" size="lg">Abrir caja</Button>
          ) : (
            <Button variant="danger" onClick={closeCash} icon="logout" size="lg">Cerrar caja</Button>
          )}
          <Button variant="ghost" icon="cash" size="lg">Entrega efectivo</Button>
          <Button variant="ghost" icon="box" size="lg">Bóveda</Button>
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20 }}>
        <Card style={{
          background: "var(--ink-900)", color: "var(--paper-50)", padding: 32,
          display: "flex", flexDirection: "column", gap: 12, boxShadow: "var(--elev-3)",
          position: "relative", overflow: "hidden"
        }} className="lift">
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 10%, color-mix(in oklab, var(--brass-400) 20%, transparent), transparent 60%)" }}/>
          <div className="ovl" style={{ color: "var(--brass-300)", position: "relative" }}>Estado de operación</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                background: cashOpen ? "var(--sage-500)" : "var(--coral-500)",
              }}/>
              {cashOpen && (
                <div style={{
                  position: "absolute", inset: -6, borderRadius: "50%",
                  background: "var(--sage-500)", opacity: 0.3,
                  animation: "pulse 2s infinite"
                }}/>
              )}
            </div>
            <h2 className="display" style={{ fontSize: 48, lineHeight: 1, color: "var(--paper-50)", margin: 0 }}>
              {cashOpen ? "Caja abierta" : "Caja cerrada"}
            </h2>
          </div>
          <p style={{ marginTop: 12, fontSize: 14, color: "color-mix(in oklab, var(--paper-50) 70%, transparent)", fontStyle: "italic", fontFamily: "var(--font-display)", position: "relative" }}>
            {cashOpen ? "Registrando transacciones y movimientos de efectivo en tiempo real." : "La operación de registro está suspendida hasta el inicio de turno."}
          </p>
        </Card>

        <Card style={{
          display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 24, alignItems: "center", padding: "0 32px"
        }} className="lift">
          <Block k="Cajero asignado" v={<><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-900)" }}>Maria Gonzalez</div><div style={{ fontSize: 12, color: "var(--slate-500)" }}>ID 4920 · Terminal POS-01</div></>}/>
          <Block k="Apertura"     v={<span className="num" style={{ fontWeight: 600 }}>08:14:22 AM</span>}/>
          <Block k="Último retiro" v={<span className="num" style={{ color: "var(--slate-500)" }}>10:12:05 AM</span>}/>
          <Block k="Balance total" v={<span className="num display" style={{ fontSize: 32, color: "var(--ink-900)", fontWeight: 500 }}>$14.250</span>}/>
        </Card>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 20 }}>
        <KpiCard label="Fondo inicial"  value={5000}   note="Verificado al inicio de turno" tone="ink"/>
        <KpiCard label="Ventas en efectivo" value={12450}  note="45 transacciones registradas"          tone="sage"/>
        <KpiCard label="Retiros a bóveda"   value={-3200}  note="Transferencias a seguridad"         tone="coral"/>
        <KpiCard label="Disponible en caja"   value={14250}  note="Monto auditable actual"   tone="brass" hero/>
      </div>

      {/* Movements log */}
      <SectionPanel
        eyebrow="Registro de auditoría"
        title="Historial de movimientos de efectivo"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" size="sm" icon="filter">Filtrar</Button>
            <Button variant="ghost" size="sm" icon="download">Exportar log</Button>
          </div>
        }
      >
        <table className="ax">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Hora</th>
              <th style={{ width: 150 }}>Tipo mov.</th>
              <th>Concepto / Descripción</th>
              <th style={{ width: 140 }}>Referencia</th>
              <th className="num" style={{ width: 140 }}>Importe</th>
              <th className="num" style={{ width: 160 }}>Balance caja</th>
            </tr>
          </thead>
          <tbody>
            {MOVES.map((m, i) => (
              <tr key={i} style={{ background: i === 0 ? "var(--paper-50)" : undefined }}>
                <td className="num" style={{ color: "var(--slate-500)", fontSize: 13 }}>{m.time}</td>
                <td>{moveBadge(m.type)}</td>
                <td style={{ fontWeight: 600, color: "var(--ink-900)" }}>{m.desc}</td>
                <td className="num" style={{ color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>{m.ref}</td>
                <td className="num" style={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: m.amount == null ? "var(--slate-400)" : m.amount < 0 ? "var(--coral-600)" : "var(--sage-600)"
                }}>
                  {m.amount == null ? "—" : `${m.amount > 0 ? "+ " : "− "}$${Math.abs(m.amount).toLocaleString("es-CL")}`}
                </td>
                <td className="num" style={{ fontWeight: 700, color: "var(--ink-900)" }}>$ {m.balance.toLocaleString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: "flex", padding: "18px 24px", background: "var(--paper-50)", borderTop: "1px solid var(--border-default)", fontSize: 13, color: "var(--slate-500)" }}>
          <span style={{ fontWeight: 500 }}>Mostrando 6 de 48 movimientos registrados hoy</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button style={pagBtn2}><Icon name="chevronLeft" size={14}/></button>
            {[1,2,3,"…",8].map((p, i) => (
              <button key={i} style={{
                minWidth: 32, height: 32, borderRadius: 8,
                background: p === 1 ? "var(--ink-900)" : "transparent",
                color: p === 1 ? "var(--paper-50)" : "var(--ink-900)",
                border: p === 1 ? "1px solid var(--ink-900)" : "1px solid transparent",
                fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 8px"
              }}>{p}</button>
            ))}
            <button style={pagBtn2}><Icon name="chevronRight" size={14}/></button>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
};

const Block = ({ k, v }) => (
  <div>
    <div className="ovl" style={{ marginBottom: 4 }}>{k}</div>
    <div style={{ fontSize: 14 }}>{v}</div>
  </div>
);

const KpiCard = ({ label, value, note, tone, hero }) => {
  const accents = {
    ink:   { bar: "var(--ink-900)",     fg: "var(--ink-900)" },
    sage:  { bar: "var(--sage-500)",    fg: "var(--sage-700)" },
    coral: { bar: "var(--coral-500)",   fg: "var(--coral-700)" },
    brass: { bar: "var(--brass-400)",   fg: "var(--ink-900)" },
  };
  const a = accents[tone] || accents.ink;
  return (
    <div className="lift" style={{
      background: hero ? "var(--paper-50)" : "#fff",
      border: "1px solid var(--border-default)", borderLeft: `3px solid ${a.bar}`,
      borderRadius: 12, padding: "16px 18px", boxShadow: "var(--elev-1)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div className="ovl">{label}</div>
      <div className="display" style={{ fontSize: 30, lineHeight: 1, color: a.fg }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{value < 0 ? "−$" : "$"}</span>
        <span className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{Math.abs(value).toLocaleString("es-CL")}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--slate-500)" }}>{note}</div>
    </div>
  );
};

const pagBtn2 = { minWidth: 28, height: 28, borderRadius: 6, background: "transparent",
  border: "1px solid var(--border-default)", color: "var(--ink-900)", cursor: "pointer",
  display: "inline-grid", placeItems: "center", padding: "0 8px", fontFamily: "var(--font-mono)", fontSize: 12 };

window.CashScreen = CashScreen;
