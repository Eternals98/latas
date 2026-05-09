"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginScreen } from "@/components/LoginScreen";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Supabase crea el usuario en auth + callback sincroniza perfil
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.detail === "Email ya registrado"
            ? "Este email ya está registrado"
            : "Error al crear la cuenta"
        );
        return;
      }

      toast.success("¡Cuenta creada! Bienvenido");
      router.push("/salesRegister");
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginScreen
      mode="register"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}