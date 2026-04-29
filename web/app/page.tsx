"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [dashboard, setDashboard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/bff/dashboard");
      if (!response.ok) {
        setError("No se pudo cargar el dashboard");
        return;
      }
      const payload = await response.json();
      setDashboard(JSON.stringify(payload, null, 2));
    }
    load().catch(() => setError("No se pudo cargar el dashboard"));
  }, []);

  return (
    <section className="grid">
      <h1>LATAS Dashboard</h1>
      <div className="card">
        {error && <p>{error}</p>}
        {!error && !dashboard && <p>Cargando...</p>}
        {dashboard && <pre>{dashboard}</pre>}
      </div>
    </section>
  );
}
