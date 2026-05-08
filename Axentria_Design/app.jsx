/* Axentria — main app shell, routing and tweaks. */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "brass",
  "density": "comfy",
  "fontDisplay": "Fraunces",
  "showCashBanner": true
}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  brass:  { 300: "#F0C778", 400: "#E0A24A", 500: "#B97A2A", 600: "#8C5A1F", 50: "#FBF1DD" },
  ink:    { 300: "#9CA9BA", 400: "#5C6A80", 500: "#1F2D45", 600: "#0F1B2D", 50: "#E8ECF2" },
  coral:  { 300: "#F7B19E", 400: "#E8836A", 500: "#D65A3B", 600: "#A8442B", 50: "#FBE4DD" },
  sage:   { 300: "#A8C7A4", 400: "#7AAA72", 500: "#508F4A", 600: "#3B6A36", 50: "#DEEBDB" },
};

const App = () => {
  const [signedIn, setSignedIn] = useStateApp(false);
  const [route, setRoute]       = useStateApp("dashboard");
  const [cashOpen, setCashOpen] = useStateApp(true);
  const [tweaks, setTweak]      = useTweaks(TWEAK_DEFAULTS);

  // Apply accent palette to CSS vars
  useEffectApp(() => {
    const p = ACCENT_PALETTES[tweaks.accent] || ACCENT_PALETTES.brass;
    const r = document.documentElement;
    r.style.setProperty("--brass-50",  p[50]);
    r.style.setProperty("--brass-300", p[300]);
    r.style.setProperty("--brass-400", p[400]);
    r.style.setProperty("--brass-500", p[500]);
    r.style.setProperty("--brass-600", p[600]);
    r.style.setProperty("--font-display", `"${tweaks.fontDisplay}", Georgia, serif`);
    document.body.dataset.density = tweaks.density;
  }, [tweaks.accent, tweaks.fontDisplay, tweaks.density]);

  if (!signedIn) {
    return <LoginScreen onSignIn={() => setSignedIn(true)} />;
  }

  const meta = {
    dashboard:    { title: "Resumen de Operaciones", eyebrow: "Panel · 8 may 2026",      subtitle: "Visión general consolidada del día" },
    sale:         { title: "Registro de Venta",       eyebrow: "Operación · Nuevo asiento", subtitle: "Capture una transacción comercial" },
    transactions: { title: "Transacciones",           eyebrow: "Historial",                 subtitle: "Registro completo de movimientos" },
    cash:         { title: "Gestión de Caja",          eyebrow: "Caja Diaria",                subtitle: "Movimientos y status del cajón" },
    reports:      { title: "Reportes Operativos",     eyebrow: "Informes",                   subtitle: "Genere y exporte reportes auditables" },
    admin:        { title: "Administración",          eyebrow: "Sistema",                    subtitle: "Usuarios, sucursales y catálogos" },
  }[route];

  const screen = (() => {
    switch (route) {
      case "dashboard":    return <DashboardScreen go={setRoute}/>;
      case "sale":         return <SaleScreen cashOpen={cashOpen} openCash={() => setCashOpen(true)} />;
      case "transactions": return <TxScreen/>;
      case "cash":         return <CashScreen cashOpen={cashOpen} openCash={() => setCashOpen(true)} closeCash={() => setCashOpen(false)} />;
      case "reports":      return <ReportsScreen/>;
      case "admin":        return <AdminPlaceholder/>;
      default:             return <DashboardScreen go={setRoute}/>;
    }
  })();

  const topActions = route === "transactions" ? (
    <Button variant="primary" icon="plus" onClick={() => setRoute("sale")}>
      Nueva venta
    </Button>
  ) : (route === "dashboard" || route === "cash") ? (
    <Button variant="accent" icon="plus" onClick={() => setRoute("sale")}>
      Registrar venta
    </Button>
  ) : null;

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--surface-app)", color: "var(--fg-1)" }}>
      <Sidebar
        active={route}
        onNavigate={setRoute}
        onLogout={() => setSignedIn(false)}
        cashOpen={cashOpen && tweaks.showCashBanner}
      />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar {...meta} actions={topActions}/>
        <div key={route} className="fade-in" style={{ flex: 1, overflow: "auto", background: "var(--surface-app)" }}>
          {screen}
        </div>
      </main>

      <TweaksPanel title="Ajustes de Diseño">
        <TweakSection label="Identidad Visual">
          <TweakRadio
            label="Color de Acento"
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={["brass", "ink", "coral", "sage"]}
          />
        </TweakSection>
        <TweakSection label="Tipografía">
          <TweakRadio
            label="Fuente Display"
            value={tweaks.fontDisplay}
            onChange={(v) => setTweak("fontDisplay", v)}
            options={["Instrument Serif", "Bodoni Moda", "Fraunces"]}
          />
        </TweakSection>
        <TweakSection label="Interfaz POS">
          <TweakRadio
            label="Densidad"
            value={tweaks.density}
            onChange={(v) => setTweak("density", v)}
            options={["compact", "comfy", "airy"]}
          />
          <TweakToggle
            label="Banner de caja en sidebar"
            value={tweaks.showCashBanner}
            onChange={(v) => setTweak("showCashBanner", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

const AdminPlaceholder = () => (
  <div style={{ padding: "100px 32px", maxWidth: 640, margin: "0 auto", textAlign: "center" }} className="fade-in">
    <div style={{
      width: 80, height: 80, borderRadius: 24, background: "var(--paper-200)",
      display: "grid", placeItems: "center", margin: "0 auto 32px", color: "var(--slate-400)",
      boxShadow: "var(--elev-1)"
    }}>
      <Icon name="settings" size={40}/>
    </div>
    <h2 className="display" style={{ fontSize: 44, lineHeight: 1.1, margin: 0, color: "var(--ink-900)" }}>Administración</h2>
    <p style={{ marginTop: 16, color: "var(--slate-500)", fontSize: 16, lineHeight: 1.6 }}>
      Configuración avanzada del sistema, gestión de catálogos maestros y permisos de usuario. 
      Esta sección requiere permisos de nivel <span style={{ color: "var(--ink-900)", fontWeight: 700 }}>Administrador</span>.
    </p>
    <div style={{ marginTop: 32 }}>
      <Button variant="ghost" onClick={() => window.location.reload()}>Solicitar acceso elevado</Button>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
