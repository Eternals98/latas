"use client";

import { FormEvent, useState } from "react";

const defaultPayload = {
  empresa: "latas_sas",
  tipo: "formal",
  fecha_venta: new Date().toISOString().slice(0, 10),
  numero_referencia: "",
  descripcion: "",
  valor_total: "0.00",
  cliente_id: null,
  pagos: [{ medio: "efectivo", monto: "0.00" }]
};

export default function VentasPage() {
  const [payload, setPayload] = useState(defaultPayload);
  const [result, setResult] = useState<string>("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/bff/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <section className="grid">
      <h1>Registrar venta</h1>
      <form className="card" onSubmit={submit}>
        <input
          placeholder="Numero referencia"
          value={payload.numero_referencia}
          onChange={(e) => setPayload({ ...payload, numero_referencia: e.target.value })}
          style={{ width: "100%", padding: 10, marginBottom: 8 }}
        />
        <input
          placeholder="Descripcion"
          value={payload.descripcion}
          onChange={(e) => setPayload({ ...payload, descripcion: e.target.value })}
          style={{ width: "100%", padding: 10, marginBottom: 8 }}
        />
        <input
          placeholder="Valor total"
          value={payload.valor_total}
          onChange={(e) => setPayload({ ...payload, valor_total: e.target.value })}
          style={{ width: "100%", padding: 10, marginBottom: 8 }}
        />
        <input
          placeholder="Medio de pago"
          value={payload.pagos[0].medio}
          onChange={(e) =>
            setPayload({ ...payload, pagos: [{ ...payload.pagos[0], medio: e.target.value }] })
          }
          style={{ width: "100%", padding: 10, marginBottom: 8 }}
        />
        <input
          placeholder="Monto pago"
          value={payload.pagos[0].monto}
          onChange={(e) =>
            setPayload({ ...payload, pagos: [{ ...payload.pagos[0], monto: e.target.value }] })
          }
          style={{ width: "100%", padding: 10, marginBottom: 8 }}
        />
        <button type="submit">Guardar</button>
      </form>
      {result && (
        <div className="card">
          <pre>{result}</pre>
        </div>
      )}
    </section>
  );
}
