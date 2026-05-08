/* Informes — Reportes Operativos. */
const { useState: useStateRep } = React;

const REPORT_TYPES = [
  { id: "detail",   icon: "list",       title: "Detallado diario",  blurb: "Registro de transacciones línea por línea." },
  { id: "consol",   icon: "receipt",    title: "Consolidado diario",blurb: "Totales agregados por día y por entidad." },
  { id: "method",   icon: "creditCard", title: "Pagos por método",  blurb: "Desglose de efectivo, tarjeta, transferencia." },
  { id: "cash",     icon: "cash",       title: "Cierre de caja",    blurb: "Aperturas, retiros y diferencias." },
];

const ReportsScreen = () => {
  const [type, setType] = useStateRep("consol");

  const sample = [
    { date: "2026-05-08", entity: "Latas S.A.S.",      method: "Efectivo",                value: 12450 },
    { date: "2026-05-08", entity: "Tomás Gómez",        method: "Tarjeta de Crédito",      value:  3200 },
    { date: "2026-05-07", entity: "Latas S.A.S.",      method: "Transferencia Bancaria",  value:   850 },
    { date: "2026-05-07", entity: "Genérico",          method: "Efectivo",                value:   420 },
    { date: "2026-05-06", entity: "Tomás Gómez",        method: "Efectivo",                value:  8100 },
    { date: "2026-05-06", entity: "Latas S.A.S.",      method: "Tarjeta de Crédito",      value:  2375 },
    { date: "2026-05-05", entity: "Genérico",          method: "Efectivo",                value:  1640 },
  ];

  return (
    <div style={{ padding: "32px 32px 100px", maxWidth: 1400, margin: "0 auto" }} className="fade-in">
      <p style={{ marginTop: -10, marginBottom: 24, fontSize: 14, color: "var(--slate-500)", maxWidth: 700, lineHeight: 1.6 }}>
        Genere resúmenes operativos y financieros auditables. Los informes se emiten bajo papel digital con marca de agua y firma del cajero responsable, listos para exportación o impresión física.
      </p>

      {/* Type cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {REPORT_TYPES.map(t => {
          const active = t.id === type;
          return (
            <button key={t.id} onClick={() => setType(t.id)} className="lift"
              style={{
                textAlign: "left", padding: "24px 20px", borderRadius: 16, cursor: "pointer",
                background: active ? "var(--ink-900)" : "#fff",
                color: active ? "var(--paper-50)" : "var(--ink-900)",
                border: "1px solid", borderColor: active ? "var(--ink-900)" : "var(--border-default)",
                fontFamily: "var(--font-sans)", boxShadow: "var(--elev-1)",
                position: "relative", transition: "all var(--dur-2)"
              }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: active ? "var(--brass-400)" : "var(--paper-200)",
                color: active ? "var(--ink-900)" : "var(--slate-700)",
                display: "grid", placeItems: "center", marginBottom: 16,
              }}>
                <Icon name={t.icon} size={20}/>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{t.title}</div>
              <div style={{ fontSize: 13, marginTop: 8, color: active ? "color-mix(in oklab, var(--paper-50) 60%, transparent)" : "var(--slate-500)", lineHeight: 1.4 }}>{t.blurb}</div>
              {active ? (
                <span style={{ position: "absolute", top: 16, right: 16,
                              width: 24, height: 24, borderRadius: 8, background: "var(--brass-400)",
                              color: "var(--ink-900)", display: "grid", placeItems: "center" }}>
                  <Icon name="check" size={14}/>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Parameters */}
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div className="ovl" style={{ marginBottom: 18, color: "var(--slate-500)" }}>Configuración de emisión</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr auto auto", gap: 16, alignItems: "end" }}>
          <DateField label="Fecha inicial" value="2026-05-01"/>
          <DateField label="Fecha final"    value="2026-05-31"/>
          <SelectField label="Empresa / Emisor" options={["Todas las entidades","Latas S.A.S.","Tomás Gómez","Venta Mostrador"]}/>
          <SelectField label="Agrupar por" options={["Día (Cronológico)","Medio de pago","Cliente / Entidad"]}/>
          <Button variant="ghost" icon="filter">Filtros</Button>
          <Button variant="primary" icon="check" style={{ padding: "0 24px" }}>Generar reporte</Button>
        </div>
      </Card>

      {/* Preview */}
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border-default)", background: "var(--paper-50)" }}>
          <div style={{ flex: 1 }}>
            <div className="ovl" style={{ color: "var(--slate-500)" }}>Vista previa de documento</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--ink-900)" }}>Consolidado Diario de Ventas · Mayo 2026</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" size="sm" icon="print">Imprimir</Button>
            <Button variant="ghost" size="sm" icon="download">PDF</Button>
            <Button variant="primary" size="sm" icon="download">Excel</Button>
          </div>
        </div>

        {/* Faux ledger paper */}
        <div style={{ padding: "40px 20px", background: "var(--paper-200)", display: "grid", placeItems: "center" }}>
          <div style={{
            background: "#fff", border: "1px solid var(--border-default)", borderRadius: 4,
            padding: "60px 72px", boxShadow: "var(--elev-3)", width: "100%", maxWidth: 1000,
            position: "relative", minHeight: 800,
          }}>
            {/* Margin line */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 80, width: 1.5, background: "rgba(217, 87, 61, 0.15)" }}/>
            
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 48, position: "relative" }}>
              <div>
                <img src="assets/logo-axentria.svg" alt="Axentria" style={{ height: 24, marginBottom: 16, opacity: 0.8 }} />
                <h1 className="display" style={{ fontSize: 42, lineHeight: 1, color: "var(--ink-900)", margin: 0 }}>Consolidado de Ventas</h1>
                <div style={{ fontSize: 14, color: "var(--slate-500)", marginTop: 8, fontWeight: 500 }}>Período: 01 May 2026 — 31 May 2026</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "var(--slate-500)", lineHeight: 1.6 }}>
                <div className="ovl" style={{ marginBottom: 4 }}>Metadatos de emisión</div>
                <div>Emisor: <span style={{ color: "var(--ink-900)", fontWeight: 700 }}>Maria Gonzalez</span></div>
                <div>Fecha: 08 May 2026 · 14:32</div>
                <div style={{ fontFamily: "var(--font-mono)", marginTop: 4, fontSize: 11 }}>REF: RPT-2026-0042-X</div>
              </div>
            </div>

            <table className="ax" style={{ background: "transparent", position: "relative" }}>
              <thead>
                <tr>
                  <th style={{ background: "transparent", paddingLeft: 0 }}>Fecha</th>
                  <th style={{ background: "transparent" }}>Entidad</th>
                  <th style={{ background: "transparent" }}>Método de pago</th>
                  <th className="num" style={{ background: "transparent" }}>Importe Total</th>
                </tr>
              </thead>
              <tbody>
                {sample.map((s, i) => (
                  <tr key={i}>
                    <td className="num" style={{ color: "var(--slate-500)", paddingLeft: 0 }}>{s.date}</td>
                    <td style={{ fontWeight: 600 }}>{s.entity}</td>
                    <td>{s.method}</td>
                    <td className="num" style={{ fontWeight: 800, color: "var(--ink-900)" }}>$ {s.value.toLocaleString("es-CL")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ paddingTop: 32, borderBottom: "none" }}>
                    <div className="ovl" style={{ fontSize: 12, color: "var(--slate-500)" }}>Total consolidado del período</div>
                  </td>
                  <td className="num" style={{ paddingTop: 32, borderBottom: "none" }}>
                    <div className="display" style={{ fontSize: 32, fontWeight: 500, color: "var(--ink-900)" }}>$ 29.035</div>
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: 60, paddingTop: 20, borderTop: "1.5px dashed var(--border-default)",
                          display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--slate-400)", fontStyle: "italic", fontFamily: "var(--font-display)", position: "relative" }}>
              <span>Documento generado por Axentria Cloud POS. Prohibida su alteración.</span>
              <span>Hoja 1 de 1</span>
            </div>

            {/* Faux stamp */}
            <div style={{
              position: "absolute", bottom: 80, right: 80, width: 100, height: 100,
              border: "3px double var(--brass-400)", borderRadius: "50%",
              display: "grid", placeItems: "center", color: "var(--brass-600)",
              transform: "rotate(-15deg)", opacity: 0.25, pointerEvents: "none",
              fontSize: 10, fontWeight: 800, textAlign: "center", textTransform: "uppercase"
            }}>
              <div>Auditado<br/>Axentria<br/>2026</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const DateField = ({ label, value }) => (
  <div>
    <label className="ovl" style={{ display: "block", marginBottom: 6, color: "var(--ink-900)" }}>{label}</label>
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", top: 11, left: 12, color: "var(--slate-400)" }}><Icon name="calendar" size={14}/></span>
      <input className="ax-input mono" defaultValue={value} style={{ paddingLeft: 34 }}/>
    </div>
  </div>
);
const SelectField = ({ label, options }) => (
  <div>
    <label className="ovl" style={{ display: "block", marginBottom: 6, color: "var(--ink-900)" }}>{label}</label>
    <div style={{ position: "relative" }}>
      <select className="ax-input" style={{ appearance: "none", paddingRight: 32 }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <span style={{ position: "absolute", top: 12, right: 10, color: "var(--slate-400)", pointerEvents: "none" }}>
        <Icon name="chevronDown" size={14}/>
      </span>
    </div>
  </div>
);

window.ReportsScreen = ReportsScreen;
