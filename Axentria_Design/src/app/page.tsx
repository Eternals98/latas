'use client';

import React, { useState, useEffect } from 'react';
import { useTweaks } from '@/lib/useTweaks';
import { Sidebar, TopBar } from '@/components/Shell';
import { LoginScreen } from '@/components/LoginScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { SaleScreen } from '@/components/SaleScreen';
import { TransactionsScreen } from '@/components/TransactionsScreen';
import { CashScreen } from '@/components/CashScreen';
import { ReportsScreen } from '@/components/ReportsScreen';
import { Button, Icon, cn } from '@/components/Primitives';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle } from '@/components/TweaksPanel';

const TWEAK_DEFAULTS = {
  "accent": "brass",
  "density": "comfy",
  "fontDisplay": "Instrument Serif",
  "showCashBanner": true
};

const ACCENT_PALETTES: { [key: string]: { [key: number]: string, 50: string } } = {
  brass:  { 300: "#F0C778", 400: "#E0A24A", 500: "#B97A2A", 600: "#8C5A1F", 50: "#FBF1DD" },
  ink:    { 300: "#9CA9BA", 400: "#5C6A80", 500: "#1F2D45", 600: "#0F1B2D", 50: "#E8ECF2" },
  coral:  { 300: "#F7B19E", 400: "#E8836A", 500: "#D65A3B", 600: "#A8442B", 50: "#FBE4DD" },
  sage:   { 300: "#A8C7A4", 400: "#7AAA72", 500: "#508F4A", 600: "#3B6A36", 50: "#DEEBDB" },
};

export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [route, setRoute]       = useState("dashboard");
  const [cashOpen, setCashOpen] = useState(true);
  const [tweaks, setTweak]      = useTweaks(TWEAK_DEFAULTS);

  // Apply accent palette to CSS vars
  useEffect(() => {
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

  const metaMap: { [key: string]: { title: string, eyebrow: string, subtitle: string } } = {
    dashboard:    { title: "Resumen de Operaciones", eyebrow: "Panel · 8 may 2026",      subtitle: "Visión general consolidada del día" },
    sale:         { title: "Registro de Venta",       eyebrow: "Operación · Nuevo asiento", subtitle: "Capture una transacción comercial" },
    transactions: { title: "Transacciones",           eyebrow: "Historial",                 subtitle: "Registro completo de movimientos" },
    cash:         { title: "Gestión de Caja",          eyebrow: "Caja Diaria",                subtitle: "Movimientos y status del cajón" },
    reports:      { title: "Reportes Operativos",     eyebrow: "Informes",                   subtitle: "Genere y exporte reportes auditables" },
    admin:        { title: "Administración",          eyebrow: "Sistema",                    subtitle: "Usuarios, sucursales y catálogos" },
  };
  
  const meta = metaMap[route] || metaMap.dashboard;

  const screen = (() => {
    switch (route) {
      case "dashboard":    return <DashboardScreen go={setRoute}/>;
      case "sale":         return <SaleScreen cashOpen={cashOpen} openCash={() => setCashOpen(true)} />;
      case "transactions": return <TransactionsScreen/>;
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
    <div className="flex h-screen bg-paper-100 text-ink-900 font-sans">
      <Sidebar
        active={route}
        onNavigate={setRoute}
        onLogout={() => setSignedIn(false)}
        cashOpen={cashOpen && tweaks.showCashBanner}
      />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <TopBar {...meta} actions={topActions}/>
        <div key={route} className="flex-1 overflow-auto bg-paper-100 animate-in fade-in duration-500">
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
}

const AdminPlaceholder = () => (
  <div className="py-24 px-8 max-w-[640px] mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="w-20 h-20 rounded-3xl bg-paper-200 grid place-items-center mx-auto mb-8 text-slate-400 shadow-sm border border-slate-200">
      <Icon name="settings" size={40}/>
    </div>
    <h2 className="font-display text-[44px] leading-tight m-0 text-ink-900">Administración</h2>
    <p className="mt-4 text-slate-500 text-lg leading-relaxed">
      Configuración avanzada del sistema, gestión de catálogos maestros y permisos de usuario. 
      Esta sección requiere permisos de nivel <span className="text-ink-900 font-bold">Administrador</span>.
    </p>
    <div className="mt-8">
      <Button variant="ghost" onClick={() => window.location.reload()}>Solicitar acceso elevado</Button>
    </div>
  </div>
);
