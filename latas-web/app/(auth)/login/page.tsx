"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { LoginScreen } from "@/components/LoginScreen";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Autenticar con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // 2. Guardar JWT en backend/cookie
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.session?.access_token,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        setError("Error sincronizando perfil");
        return;
      }

      toast.success("Login exitoso");
      router.push("/dashboard");
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginScreen
      mode="login"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}