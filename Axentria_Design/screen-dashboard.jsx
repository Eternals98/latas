/* Dashboard — Resumen de Operaciones (paper-and-ink reskin) */
const { useEffect: useEffectDash, useState: useStateDash } = React;

const useCountUp = (target, dur = 700) => {
  const [v, setV] = useStateDash(0);
  useEffectDash(() => {
    let raf, t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
};

const HeroFigure = ({ label, value, delta, deltaTone = "sage", note, accent = false }) => {
  const v = useCountUp(value);
  return (
    <div className="lift" style={{
      background: accent ? "var(--ink-900)" : "#fff",
      color: accent ? "var(--paper-50)" : "var(--ink-900)",
      borderRadius: 14, padding: "22px 24px",
      border: accent ? "1px solid var(--ink-900)" : "1px solid var(--border-default)",
      boxShadow: "var(--elev-1)",
      borderLeft: accent ? "1px solid var(--ink-900)" : "3px solid var(--brass-400)",
      display: "flex", flexDirection: "column", gap: 10, minHeight: 150,
    }}>
      <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700,
                    color: accent ? "var(--brass-300)" : "var(--slate-500)" }}>
        {label}
      </div>
      <div className="display" style={{ fontSize: 52, lineHeight: 1, color: accent ? "var(--paper-50)" : "var(--ink-900)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>$</span>
        <span className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{v.toLocaleString("es-CL")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
        {delta ? (
          <span className="status-pill" style={{
            background: accent ? "color-mix(in oklab, white 15%, transparent)"
                              : (deltaTone === "sage" ? "var(--sage-50)" : "var(--coral-50)"),
            color: deltaTone === "sage" ? "var(--sage-700)" : "var(--coral-700)",
          }}>
            <Icon name={deltaTone === "sage" ? "arrowUp" : "arrowDown"} size={11}/> {delta}
          </span>
        ) : null}
        {note ? <span style={{ color: accent ? "color-mix(in oklab, white 70%, transparent)" : "var(--slate-500)" }}>{note}</span> : null}
      </div>
    </div>
  );
};

/* Tiny SVG sparkline */
const Spark = ({ data, color = "var(--brass-500)", width = 220, height = 56 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const dx = width / (data.length - 1);
  const path = data.map((v, i) => {
    const x = i * dx;
    const y = height - ((v - min) / (max - min || 1)) * (height - 6) - 3;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lastX = (data.length - 1) * dx;
  const lastY = height - ((last - min) / (max - min || 1)) * (height - 6) - 3;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={path + ` L${width},${height} L0,${height} Z`} fill={`color-mix(in oklab, ${color} 14%, transparent)`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r="3.5" fill={color}/>
      <circle cx={lastX} cy={lastY} r="6" fill={`color-mix(in oklab, ${color} 25%, transparent)`}/>
    </svg>
  );
};

const DashboardScreen = ({ go }) => {
  const entities = [
    { name: "Latas S.A.S.",     type: "Empresa",   vol: 1245, ingresos: 65400, share: 53, tone: "ink" },
    { name: "Tomás Gómez",       type: "Cliente",   vol:  892, ingresos: 42100, share: 34, tone: "brass" },
    { name: "Genérico (mostrador)", type: "Mostrador", vol: 340, ingresos: 17000, share: 13, tone: "sage" },
  ];
  const methods = [
    { name: "Efectivo",            icon: "cash",       tx: 1050, total: 85000, share: 68 },
    { name: "Tarjeta de Crédito",  icon: "creditCard", tx:  820, total: 32500, share: 26 },
    { name: "Transferencia Bancaria", icon: "box",     tx:  145, total:  7000, share:  6 },
  ];
  const dailySeries = [42,46,49,44,52,58,55,63,67,72,69,78,82,88,95,90,97,102,108,118];

  return (
    <div style={{ padding: "32px 32px 100px", maxWidth: 1400, margin: "0 auto" }} className="fade-in">
      {/* Hero row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 20 }}>
        <HeroFigure accent label="Ventas totales · Mes" value={124500} delta="+12.4% vs mes anterior" note="Cierre proyectado $138 k"/>
        <HeroFigure label="Ventas del día" value={118200} delta="+8.1%" note="hoy · 14:32"/>
        <HeroFigure label="Efectivo total en caja" value={290000} delta="−$3.200 retiros" deltaTone="coral" note="3 cajas activas"/>
      </div>

      {/* Tendencia — sparkline strip */}
      <Card style={{
        marginTop: 20, padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 240px 240px", gap: 32, alignItems: "center"
      }} className="lift">
        <div>
          <div className="ovl">Tendencia · últimos 20 días</div>
          <div className="display" style={{ fontSize: 48, lineHeight: 1.1, marginTop: 8, color: "var(--ink-900)" }}>
            $ <span className="num" style={{ fontWeight: 500 }}>124.500</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--slate-500)", marginTop: 6 }}>
            Promedio diario <span className="num" style={{ color: "var(--ink-900)", fontWeight: 700 }}>$ 6.225</span> · pico registrado el lunes 6 may
          </div>
        </div>
        <div style={{ padding: "8px 0" }}>
          <Spark data={dailySeries} color="var(--brass-500)" width={240} height={80}/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, paddingLeft: 20, borderLeft: "1px solid var(--border-subtle)" }}>
          <Row k="Ticket promedio" v="$ 18.420" mono/>
          <Row k="Ventas registradas" v="2.295" mono/>
          <Row k="Devoluciones" v="3 · $ 850" mono tone="coral"/>
          <Row k="Estado de caja" v={<Badge tone="success">abierta</Badge>}/>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginTop: 20 }}>
        {/* Entity table */}
        <SectionPanel
          eyebrow="Distribución de ventas por entidad"
          title="Quién está vendiendo"
          action={<Button variant="text" size="sm" onClick={() => {}}>Ver todas →</Button>}
        >
          <table className="ax">
            <thead>
              <tr>
                <th>Entidad</th>
                <th style={{ width: 140 }}>Tipo</th>
                <th className="num" style={{ width: 120 }}>Volumen</th>
                <th className="num" style={{ width: 160 }}>Ingresos</th>
                <th style={{ width: 180 }}>Participación</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(e => (
                <tr key={e.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={e.name} size={30} tone={e.tone}/>
                      <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{e.name}</div>
                    </div>
                  </td>
                  <td><Badge tone={e.type === "Empresa" ? "info" : e.type === "Cliente" ? "warn" : "success"}>{e.type}</Badge></td>
                  <td className="num" style={{ color: "var(--slate-600)" }}>{e.vol.toLocaleString("es-CL")}</td>
                  <td className="num" style={{ fontWeight: 700, color: "var(--ink-900)" }}>$ {e.ingresos.toLocaleString("es-CL")}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--paper-200)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${e.share}%`, height: "100%", borderRadius: 999, background: "var(--brass-400)" }}/>
                      </div>
                      <span className="num" style={{ fontSize: 11, color: "var(--slate-500)", width: 32, textAlign: "right" }}>{e.share}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPanel>

        {/* Methods + quick links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionPanel eyebrow="Desglose por método de pago" title="Cómo están pagando">
            <div style={{ display: "flex", flexDirection: "column" }}>
              {methods.map((m, i) => (
                <div key={m.name} style={{
                  display: "grid", gridTemplateColumns: "36px 1fr 80px 120px 80px",
                  alignItems: "center", padding: "14px 4px",
                  borderBottom: i < methods.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--paper-200)",
                                display: "grid", placeItems: "center", color: "var(--slate-700)" }}>
                    <Icon name={m.icon} size={16}/>
                  </div>
                  <div style={{ marginLeft: 14, fontWeight: 600, color: "var(--ink-900)" }}>{m.name}</div>
                  <div className="num" style={{ fontSize: 12, color: "var(--slate-500)", textAlign: "right" }}>{m.tx.toLocaleString("es-CL")} tx</div>
                  <div className="num" style={{ fontWeight: 700, textAlign: "right", color: "var(--ink-900)" }}>$ {m.total.toLocaleString("es-CL")}</div>
                  <div style={{ color: "var(--slate-500)", fontSize: 11, textAlign: "right" }} className="num">{m.share}%</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "14px", background: "var(--paper-50)", border: "1px solid var(--border-subtle)", borderRadius: 10, fontSize: 12, color: "var(--slate-600)", lineHeight: 1.5 }}>
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--ink-900)", fontWeight: 600 }}>Nota fiscal:</span>{" "}
              Las transacciones en efectivo afectan el saldo de caja en tiempo real. Conciliación pendiente para transferencias.
            </div>
          </SectionPanel>

          <SectionPanel eyebrow="Acciones rápidas" title="Atajos operativos">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <QuickAction icon="plus"    label="Nueva venta"  onClick={() => go("sale")}/>
              <QuickAction icon="cash"    label="Abrir caja"   accent onClick={() => go("cash")}/>
              <QuickAction icon="return"  label="Devolución"   onClick={() => go("transactions")}/>
              <QuickAction icon="receipt" label="Ver hoy"      onClick={() => go("transactions")}/>
              <QuickAction icon="list"    label="Reporte diario" onClick={() => go("reports")}/>
              <QuickAction icon="users"   label="Clientes"/>
            </div>
          </SectionPanel>
        </div>
      </div>
    </div>
  );
};

const Row = ({ k, v, mono, tone }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ color: "var(--slate-500)" }}>{k}</span>
    <span className={mono ? "num" : ""} style={{
      fontWeight: 700, color: tone === "coral" ? "var(--coral-600)" : "var(--ink-900)"
    }}>{v}</span>
  </div>
);

const SectionPanel = ({ eyebrow, title, action, children, inline }) => (
  <div className="fade-in" style={{
    marginTop: inline ? 0 : 16, background: "#fff",
    border: "1px solid var(--border-default)", borderRadius: 14, boxShadow: "var(--elev-1)",
    overflow: "hidden",
  }}>
    <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ flex: 1 }}>
        <div className="ovl">{eyebrow}</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, color: "var(--ink-900)" }}>{title}</div>
      </div>
      {action}
    </div>
    <div style={{ padding: 12 }}>{children}</div>
  </div>
);

const QuickAction = ({ icon, label, onClick, accent }) => (
  <button onClick={onClick} className="lift" style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
    background: accent ? "var(--brass-50)" : "#fff",
    border: `1px solid ${accent ? "var(--brass-200)" : "var(--border-default)"}`,
    color: "var(--ink-900)", fontWeight: 600, fontSize: 13,
    fontFamily: "var(--font-sans)",
  }}>
    <span style={{
      width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center",
      background: accent ? "var(--brass-400)" : "var(--paper-200)",
      color: accent ? "var(--ink-900)" : "var(--slate-700)",
    }}>
      <Icon name={icon} size={15}/>
    </span>
    {label}
    <span style={{ marginLeft: "auto", color: "var(--slate-400)" }}><Icon name="chevronRight" size={14}/></span>
  </button>
);

Object.assign(window, { DashboardScreen, useCountUp, Spark, SectionPanel, QuickAction });
