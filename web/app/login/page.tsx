"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      setError("Credenciales inválidas.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <section className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Acceso privado</h1>
      <form onSubmit={onSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <button type="submit">Ingresar</button>
      </form>
      {error && <p style={{ color: "#b00020" }}>{error}</p>}
    </section>
  );
}
