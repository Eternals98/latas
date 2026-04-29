"use client";

import { useState } from "react";

export default function ReportesPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [data, setData] = useState<string>("");

  async function fetchReport() {
    const response = await fetch(`/api/bff/ventas?mes=${mes}&anio=${anio}`);
    const json = await response.json();
    setData(JSON.stringify(json, null, 2));
  }

  return (
    <section className="grid">
      <h1>Reportes mensuales</h1>
      <div className="card">
        <input type="number" value={mes} onChange={(e) => setMes(Number(e.target.value))} />
        <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} />
        <button onClick={fetchReport} style={{ marginLeft: 8 }}>
          Consultar
        </button>
      </div>
      {data && (
        <div className="card">
          <pre>{data}</pre>
        </div>
      )}
    </section>
  );
}
