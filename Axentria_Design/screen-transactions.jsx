/* Transacciones — filterable table + detail drawer. */
const { useState: useStateTx } = React;

const TX_DATA = [
  { date: "2026-05-08 09:15", company: "Latas S.A.S.",     client: "Acme Industries",   ref: "INV-2026-8891", type: "Factura",       total:  12450, status: "ok"  },
  { date: "2026-05-08 10:30", company: "Tomás Gómez",      client: "Globex Corp",       ref: "REC-2026-1042", type: "Pago",          total:   3200, status: "ok"  },
  { date: "2026-05-07 14:45", company: "Latas S.A.S.",     client: "Stark Enterprises", ref: "INV-2026-8890", type: "Factura",       total:    850, status: "pending" },
  { date: "2026-05-07 08:00", company: "Tomás Gómez",      client: "Wayne Tech",        ref: "CRN-2026-0012", type: "Nota crédito",  total:   -150, status: "ok"  },
  { date: "2026-05-06 16:20", company: "Latas S.A.S.",     client: "Daily Planet",      ref: "INV-2026-8889", type: "Factura",       total:   5600, status: "void"},
  { date: "2026-05-06 11:05", company: "Genérico",         client: "Mostrador",         ref: "INV-2026-8888", type: "Factura",       total:    420, status: "ok"  },
  { date: "2026-05-05 17:45", company: "Tomás Gómez",      client: "Oscorp",            ref: "REC-2026-1039", type: "Pago",          total:   8100, status: "ok"  },
  { date: "2026-05-05 09:30", company: "Latas S.A.S.",     client: "Pied Piper",        ref: "INV-2026-8884", type: "Factura",       total:   2375, status: "ok"  },
];

const TxScreen = () => {
  const [sel, setSel] = useStateTx(0);
  const [open, setOpen] = useStateTx(true);
  const cur = TX_DATA[sel];

  const typeBadge = (t) => {
    if (t === "Factura") return <Badge tone="info">{t}</Badge>;
    if (t === "Pago") return <Badge tone="success">{t}</Badge>;
    if (t === "Nota crédito") return <Badge tone="danger">{t}</Badge>;
    return <Badge tone="neutral">{t}</Badge>;
  };

  const statusBadge = (s) => {
    if (s === "ok") return <Badge tone="success" dot={false}><Icon name="check" size={10} style={{ marginRight: 4 }}/> Conciliada</Badge>;
    if (s === "pending") return <Badge tone="warn" dot={false}><Icon name="settings" size={10} style={{ marginRight: 4 }}/> Pendiente</Badge>;
    if (s === "void") return <Badge tone="danger" dot={false}><Icon name="x" size={10} style={{ marginRight: 4 }}/> Anulada</Badge>;
    return null;
  };

  return (
    <div style={{ padding: "32px 32px 100px", display: "grid",
                  gridTemplateColumns: open ? "1fr 420px" : "1fr", gap: 24, maxWidth: 1600, margin: "0 auto" }} className="fade-in">
      <div style={{ minWidth: 0 }}>
        {/* Filter bar */}
        <Card style={{ padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="ovl" style={{ marginRight: 8, fontSize: 10, color: "var(--slate-500)" }}>Filtros</div>
          <FilterChip icon="calendar" label="1 may 2026 – 31 may 2026"/>
          <FilterChip label="Empresas: Todas"/>
          <FilterChip label="Tipo: Facturas / Pagos"/>
          <FilterChip label="Estado: Todas"/>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Button variant="ghost" size="sm" icon="filter">Más filtros</Button>
            <Button variant="ghost" size="sm" icon="download">Exportar</Button>
          </div>
        </Card>

        {/* Table */}
        <Card padding={0} style={{ overflow: "hidden" }}>
          <table className="ax">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: "center" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid var(--slate-300)", margin: "0 auto" }} />
                </th>
                <th style={{ width: 160 }}>Fecha y hora</th>
                <th>Empresa / Entidad</th>
                <th>Cliente</th>
                <th style={{ width: 140 }}>Referencia</th>
                <th style={{ width: 120 }}>Tipo</th>
                <th className="num" style={{ width: 140 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {TX_DATA.map((t, i) => (
                <tr key={i} onClick={() => { setSel(i); setOpen(true); }}
                    style={{ cursor: "pointer", background: i === sel ? "var(--brass-50)" : undefined, transition: "background 0.1s" }}>
                  <td style={{ textAlign: "center" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${i === sel ? "var(--brass-500)" : "var(--slate-200)"}`,
                      background: i === sel ? "var(--brass-400)" : "#fff",
                      display: "grid", placeItems: "center", margin: "0 auto"
                    }}>
                      {i === sel ? <Icon name="check" size={12} style={{ color: "var(--ink-900)" }}/> : null}
                    </div>
                  </td>
                  <td className="num" style={{ 
                    color: t.status === "void" ? "var(--slate-400)" : "var(--slate-600)",
                    fontSize: 13,
                    textDecoration: t.status === "void" ? "line-through" : "none" 
                  }}>{t.date}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={t.company} size={24} tone={t.company.startsWith("L") ? "ink" : t.company.startsWith("T") ? "brass" : "sage"}/>
                      <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{t.company}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--ink-900)" }}>{t.client}</td>
                  <td className="num" style={{ color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>{t.ref}</td>
                  <td>{typeBadge(t.type)}</td>
                  <td className="num" style={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: t.total < 0 ? "var(--coral-600)" : "var(--ink-900)"
                  }}>
                    {t.total < 0 ? "−" : ""}$ {Math.abs(t.total).toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ display: "flex", alignItems: "center", padding: "18px 24px", background: "var(--paper-50)", borderTop: "1px solid var(--border-default)" }}>
            <span style={{ fontSize: 13, color: "var(--slate-500)", fontWeight: 500 }}>Mostrando 1 – 8 de 1.024 transacciones</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <button style={pagBtn}><Icon name="chevronLeft" size={14}/></button>
              {[1,2,3,4,"…",51].map((p, i) => (
                <button key={i} style={{
                  minWidth: 32, height: 32, borderRadius: 8,
                  background: p === 1 ? "var(--ink-900)" : "transparent",
                  color: p === 1 ? "var(--paper-50)" : "var(--ink-900)",
                  border: p === 1 ? "1px solid var(--ink-900)" : "1px solid transparent",
                  fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 8px"
                }}>{p}</button>
              ))}
              <button style={pagBtn}><Icon name="chevronRight" size={14}/></button>
            </div>
          </div>
        </Card>
      </div>

      {/* Detail drawer */}
      {open ? (
        <aside className="fade-in" style={{
          position: "sticky", top: 32, alignSelf: "start",
        }}>
          <Card padding={0} style={{ 
            overflow: "hidden", boxShadow: "var(--elev-3)", borderTop: "4px solid var(--brass-400)" 
          }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div className="ovl" style={{ color: "var(--slate-500)" }}>Detalle de asiento</div>
                  <h3 className="display" style={{ marginTop: 8, fontSize: 26, color: "var(--ink-900)" }}>{cur.ref}</h3>
                </div>
                <button onClick={() => setOpen(false)} title="Cerrar"
                        className="lift"
                        style={{ width: 32, height: 32, borderRadius: 8, background: "var(--paper-100)", border: "1px solid var(--border-default)",
                                 cursor: "pointer", display: "grid", placeItems: "center", color: "var(--slate-500)" }}>
                  <Icon name="x" size={16}/>
                </button>
              </div>

              {/* Inverse amount display */}
              <div style={{ background: "var(--ink-900)", color: "var(--paper-50)", borderRadius: 14, padding: "24px", marginBottom: 24, boxShadow: "var(--elev-2)" }}>
                <div className="ovl" style={{ color: "var(--brass-300)" }}>Valor total facturado</div>
                <div className="display" style={{ fontSize: 44, lineHeight: 1, marginTop: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 400, opacity: 0.8 }}>$</span>
                  <span className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{Math.abs(cur.total).toLocaleString("es-CL")}</span>
                </div>
                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   {statusBadge(cur.status)}
                   <span style={{ fontSize: 11, color: "var(--paper-50)", opacity: 0.6, fontFamily: "var(--font-mono)" }}>ID_492088</span>
                </div>
              </div>

              {/* Data grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <DataRow label="Fecha y hora" value={<span className="num" style={{ fontWeight: 700 }}>{cur.date}</span>}/>
                <DataRow label="Empresa emisora" value={cur.company}/>
                <DataRow label="Cliente receptor" value={cur.client}/>
                <DataRow label="Punto de venta" value="Sede Centro · POS-01"/>
                <DataRow label="Cajero responsable" value="Maria Gonzalez"/>
                <DataRow label="Tipo de documento" value={typeBadge(cur.type)}/>
              </div>

              <div className="hairline" style={{ margin: "24px 0" }} />

              {/* Payment split */}
              <div className="ovl" style={{ marginBottom: 12 }}>Distribución de cobro</div>
              <Card variant="sunken" padding={4} style={{ borderRadius: 12, overflow: "hidden" }}>
                <PayLine icon="cash" label="Efectivo" amount={Math.round(Math.abs(cur.total) * 0.65)}/>
                <PayLine icon="creditCard" label="Tarjeta crédito" amount={Math.round(Math.abs(cur.total) * 0.25)}/>
                <PayLine icon="box" label="Transferencia" amount={Math.abs(cur.total) - Math.round(Math.abs(cur.total) * 0.65) - Math.round(Math.abs(cur.total) * 0.25)} last/>
              </Card>

              {/* Notes */}
              <div style={{ marginTop: 24 }}>
                <div className="ovl" style={{ marginBottom: 10 }}>Observaciones</div>
                <div style={{ padding: "14px 16px", background: "var(--paper-50)", border: "1px dashed var(--border-strong)",
                              borderRadius: 12, fontSize: 14, color: "var(--slate-600)", fontStyle: "italic", fontFamily: "var(--font-display)", lineHeight: 1.5 }}>
                  "Venta de productos de temporada. El cliente solicita factura electrónica enviada al correo corporativo."
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 32 }}>
                <Button variant="ghost" icon="print">Imprimir</Button>
                <Button variant="ghost" icon="download">Descargar</Button>
                <Button variant="danger" icon="return" style={{ gridColumn: "1 / -1" }}>
                  Anular transacción
                </Button>
              </div>
            </div>
          </Card>
        </aside>
      ) : null}
    </div>
  );
};

const DataRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 13, color: "var(--slate-500)", fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", textAlign: "right" }}>{value}</span>
  </div>
);


const FilterChip = ({ label, icon }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 12px", borderRadius: 8, background: "#fff",
    border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink-900)", cursor: "pointer", fontWeight: 600,
  }}>
    {icon ? <Icon name={icon} size={13}/> : null}
    {label}
    <Icon name="chevronDown" size={12} style={{ color: "var(--slate-400)" }}/>
  </div>
);
const pagBtn = { width: 28, height: 28, borderRadius: 6, background: "transparent",
  border: "1px solid var(--border-default)", color: "var(--ink-900)", cursor: "pointer", display: "grid", placeItems: "center" };

const DT = ({ k, v }) => (<><dt style={{ fontSize: 12, color: "var(--slate-500)" }}>{k}</dt><dd style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{v}</dd></>);
const PayLine = ({ icon, label, amount, last }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "10px 14px",
                borderBottom: last ? "none" : "1px solid var(--border-subtle)" }}>
    <span style={{ width: 26, height: 26, borderRadius: 6, background: "var(--paper-200)", display: "grid", placeItems: "center", color: "var(--slate-700)" }}>
      <Icon name={icon} size={13}/>
    </span>
    <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600 }}>{label}</span>
    <span className="num" style={{ marginLeft: "auto", fontWeight: 700 }}>$ {amount.toLocaleString("es-CL")}</span>
  </div>
);

window.TxScreen = TxScreen;
