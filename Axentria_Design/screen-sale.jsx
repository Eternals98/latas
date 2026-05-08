/* Registro de Venta — form + payment allocation + summary panel. */
const { useState: useStateSale, useMemo: useMemoSale } = React;

const SaleScreen = ({ cashOpen, openCash }) => {
  const [entity,  setEntity]  = useStateSale("Acme Corporation Ltd.");
  const [entityId,setEntityId]= useStateSale("9842-A");
  const [branch,  setBranch]  = useStateSale("Sede Centro");
  const [date,    setDate]    = useStateSale("2026-05-08");
  const [ref,     setRef]     = useStateSale("INV-2026-9942A");
  const [notes,   setNotes]   = useStateSale("");
  const [total,   setTotal]   = useStateSale(12450);
  const [rows,    setRows]    = useStateSale([
    { method: "Transferencia Bancaria", amount: 12000 },
  ]);

  const paid = useMemoSale(() => rows.reduce((a, r) => a + (Number(r.amount) || 0), 0), [rows]);
  const diff = total - paid;

  const addRow = () => setRows([...rows, { method: "Efectivo", amount: 0 }]);
  const updateRow = (i, k, v) => setRows(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const cashLocked = !cashOpen && rows.some(r => r.method === "Efectivo" && r.amount > 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, padding: "32px 32px 100px", maxWidth: 1400, margin: "0 auto" }}>
      {/* LEFT — form */}
      <Card padding={0} style={{ position: "relative", overflow: "hidden" }} className="fade-in">
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 6, background: "var(--brass-400)" }}/>
        
        <div style={{ padding: 32 }}>
          <div className="ovl" style={{ color: "var(--slate-500)" }}>Asiento de venta · Operación #4821</div>
          <h2 className="display" style={{ fontSize: 44, lineHeight: 1.1, marginTop: 12, color: "var(--ink-900)" }}>
            Nueva venta <span style={{ color: "var(--slate-300)", fontWeight: 300 }}>/</span> <span className="num" style={{ fontWeight: 400, color: "var(--brass-600)" }}>INV-9942A</span>
          </h2>

          {/* Two-column form */}
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="ovl" style={{ color: "var(--ink-900)" }}>Entidad del cliente</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", top: 12, left: 14, color: "var(--slate-400)" }}><Icon name="users" size={16}/></span>
                <input className="ax-input" style={{ paddingLeft: 42, paddingRight: 90, fontSize: 15 }} value={entity} onChange={e => setEntity(e.target.value)}/>
                <span style={{ position: "absolute", top: 9, right: 10, padding: "5px 10px", background: "var(--paper-200)",
                               borderRadius: 6, fontSize: 11, color: "var(--slate-600)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>ID {entityId}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Empresa o cliente final registrado en el catálogo</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="ovl" style={{ color: "var(--ink-900)" }}>Monto total a facturar</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", top: 11, left: 14, color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: 18 }}>$</span>
                <input className="ax-input mono" style={{ paddingLeft: 30, fontWeight: 700, fontSize: 18, color: "var(--ink-900)" }} type="number"
                       value={total} onChange={e => setTotal(Number(e.target.value) || 0)}/>
              </div>
              <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Valor total incluyendo impuestos aplicables</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="ovl" style={{ color: "var(--ink-900)" }}>Sucursal operativa</label>
              <div style={{ position: "relative" }}>
                <select className="ax-input" value={branch} onChange={e => setBranch(e.target.value)}
                        style={{ appearance: "none", paddingRight: 40, fontSize: 15 }}>
                  <option>Sede Centro</option>
                  <option>Sucursal Norte</option>
                  <option>Bodega Principal</option>
                </select>
                <span style={{ position: "absolute", top: 12, right: 14, color: "var(--slate-400)", pointerEvents: "none" }}>
                  <Icon name="chevronDown" size={16}/>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="ovl" style={{ color: "var(--ink-900)" }}>Fecha del movimiento</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", top: 12, left: 14, color: "var(--slate-400)" }}><Icon name="calendar" size={16}/></span>
                <input className="ax-input mono" type="date" style={{ paddingLeft: 42, fontSize: 15 }} value={date} onChange={e => setDate(e.target.value)}/>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="ovl" style={{ color: "var(--ink-900)" }}>Notas de la transacción</label>
              <textarea className="ax-input" rows={2} placeholder="Describa brevemente el motivo o detalles de la venta…"
                        value={notes} onChange={e => setNotes(e.target.value)}
                        style={{ resize: "none", fontFamily: "var(--font-sans)", fontSize: 15, padding: "12px 14px" }}/>
            </div>
          </div>

          {/* Cash warning */}
          {cashLocked && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "var(--coral-50)", border: "1px solid color-mix(in oklab, var(--coral-500) 20%, transparent)",
              color: "var(--coral-700)", padding: "16px 20px", borderRadius: 12, marginTop: 28,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--coral-100)", display: "grid", placeItems: "center", color: "var(--coral-600)", flexShrink: 0 }}>
                <Icon name="x" size={20}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Caja cerrada</div>
                <div style={{ fontSize: 13, marginTop: 2, opacity: 0.9 }}>No se pueden registrar pagos en efectivo sin una apertura de caja activa.</div>
              </div>
              <Button variant="danger" size="sm" onClick={openCash} icon="cash">Abrir caja ahora</Button>
            </div>
          )}

          {/* Allocation table */}
          <div style={{ marginTop: 32, border: "1px solid var(--border-default)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", background: "var(--paper-50)", borderBottom: "1px solid var(--border-default)" }}>
              <div className="ovl" style={{ color: "var(--ink-900)" }}>Desglose de medios de pago</div>
              <Button variant="text" size="sm" onClick={addRow} icon="plus" style={{ marginLeft: "auto", color: "var(--brass-600)" }}>Añadir método</Button>
            </div>
            
            <div style={{
              display: "grid", gridTemplateColumns: "1.4fr 1fr 48px", gap: 16, padding: "12px 20px",
              background: "var(--paper-200)", color: "var(--slate-500)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase"
            }}>
              <span>Medio de pago</span><span style={{ textAlign: "right" }}>Importe</span><span/>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((r, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1.4fr 1fr 48px", gap: 16, padding: "14px 20px",
                  alignItems: "center", borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none"
                }}>
                  <div style={{ position: "relative" }}>
                    <select className="ax-input" value={r.method} onChange={e => updateRow(i, "method", e.target.value)}
                            style={{ appearance: "none", paddingRight: 36, fontWeight: 600 }}>
                      <option>Efectivo</option>
                      <option>Tarjeta de Crédito</option>
                      <option>Tarjeta de Débito</option>
                      <option>Transferencia Bancaria</option>
                      <option>Crédito Directo</option>
                    </select>
                    <span style={{ position: "absolute", top: 11, right: 12, color: "var(--slate-400)", pointerEvents: "none" }}>
                      <Icon name="chevronDown" size={14}/>
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", top: 11, left: 14, color: "var(--slate-400)", fontFamily: "var(--font-mono)" }}>$</span>
                    <input type="number" className="ax-input mono" style={{ paddingLeft: 28, textAlign: "right", fontWeight: 700, fontSize: 16 }}
                           value={r.amount} onChange={e => updateRow(i, "amount", Number(e.target.value) || 0)}/>
                  </div>
                  <button onClick={() => removeRow(i)} className="lift"
                          style={{ width: 36, height: 36, borderRadius: 8, background: "var(--paper-100)", border: "1px solid var(--border-default)",
                                   color: "var(--slate-500)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                    <Icon name="trash" size={14}/>
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px",
              background: "var(--paper-50)", borderTop: "1px solid var(--border-default)"
            }}>
              <span className="ovl" style={{ fontSize: 12 }}>Total asignado</span>
              <span className="num" style={{ color: "var(--ink-900)", fontWeight: 800, fontSize: 18 }}>$ {paid.toLocaleString("es-CL")}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* RIGHT — summary */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24, alignSelf: "start" }}>
        <SummaryCard label="Total de la venta" value={total} variant="inverse"/>
        <SummaryCard label="Monto cubierto" value={paid} variant="default"/>
        <SummaryCard 
          label={diff === 0 ? "Balance exacto" : diff > 0 ? "Saldo pendiente" : "Vuelto / Excedente"} 
          value={diff} 
          tone={diff === 0 ? "sage" : diff > 0 ? "coral" : "sage"}
        />

        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
          <Button variant="accent" size="lg" disabled={cashLocked || diff > 0} 
                  style={{ height: 56, fontSize: 16, boxShadow: "var(--elev-2)" }} 
                  onClick={() => {}} icon="check">
            Registrar transacción
          </Button>
          <Button variant="ghost" size="lg" style={{ height: 52 }}>
            Cancelar y limpiar
          </Button>
        </div>

        <Card style={{ background: "var(--paper-50)", padding: 20 }}>
          <div className="ovl" style={{ marginBottom: 12, fontSize: 10 }}>Atajos de teclado</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Shortcut k="F2" label="Nueva venta"/>
            <Shortcut k="Ctrl + S" label="Guardar asiento"/>
            <Shortcut k="Esc" label="Limpiar formulario"/>
          </div>
        </Card>
      </aside>
    </div>
  );
};

const SummaryCard = ({ label, value, variant = "default", tone }) => {
  const isNeg = value < 0;
  const fg = tone === "coral" ? "var(--coral-600)" : tone === "sage" ? "var(--sage-600)" : variant === "inverse" ? "var(--paper-50)" : "var(--ink-900)";
  const bg = variant === "inverse" ? "var(--ink-900)" : "#fff";
  
  return (
    <Card style={{
      background: bg,
      color: variant === "inverse" ? "var(--paper-50)" : "var(--ink-900)",
      padding: "20px 24px",
      borderLeft: variant === "inverse" ? "none" : `4px solid ${tone === "coral" ? "var(--coral-500)" : tone === "sage" ? "var(--sage-500)" : "var(--brass-400)"}`,
    }} className="lift">
      <div className="ovl" style={{ color: variant === "inverse" ? "var(--brass-300)" : "var(--slate-500)" }}>{label}</div>
      <div className="display" style={{ fontSize: 42, lineHeight: 1.1, marginTop: 10, color: fg }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{isNeg ? "−" : ""}$</span>
        <span className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{Math.abs(value).toLocaleString("es-CL")}</span>
      </div>
    </Card>
  );
};

const Shortcut = ({ k, label }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 12, color: "var(--slate-600)" }}>{label}</span>
    <kbd style={{ 
      fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 6px", 
      background: "#fff", border: "1px solid var(--border-default)", 
      borderRadius: 4, color: "var(--ink-900)", fontWeight: 600
    }}>{k}</kbd>
  </div>
);

window.SaleScreen = SaleScreen;


const Field = ({ label, hint, children, full }) => (
  <div style={{ gridColumn: full ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 6 }}>
    <label className="ovl" style={{ color: "var(--ink-900)" }}>{label}</label>
    {children}
    {hint ? <div style={{ fontSize: 11, color: "var(--slate-500)" }}>{hint}</div> : null}
  </div>
);

const SummaryRow = ({ label, value, accent, tone }) => {
  const isNeg = value < 0;
  const fg = tone === "coral" ? "var(--coral-600)" : tone === "sage" ? "var(--sage-600)" : "var(--ink-900)";
  return (
    <div style={{
      background: accent ? "var(--ink-900)" : "#fff",
      color: accent ? "var(--paper-50)" : "var(--ink-900)",
      borderRadius: 12, padding: "16px 18px", border: "1px solid var(--border-default)",
      borderColor: accent ? "var(--ink-900)" : "var(--border-default)",
      borderLeft: accent ? "1px solid var(--ink-900)" : `3px solid ${tone === "coral" ? "var(--coral-500)" : tone === "sage" ? "var(--sage-500)" : "var(--brass-400)"}`,
      boxShadow: "var(--elev-1)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
                    color: accent ? "var(--brass-300)" : "var(--slate-500)" }}>
        {label}
      </div>
      <div className="display" style={{ fontSize: 36, lineHeight: 1.1, marginTop: 6,
                                        color: accent ? "var(--paper-50)" : fg }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{isNeg ? "−" : ""}$</span>
        <span className="num" style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{Math.abs(value).toLocaleString("es-CL")}</span>
      </div>
    </div>
  );
};

const Kbd = ({ k }) => <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 6px", background: "#fff",
  border: "1px solid var(--border-default)", borderRadius: 4, color: "var(--ink-900)" }}>{k}</kbd>;

window.SaleScreen = SaleScreen;
