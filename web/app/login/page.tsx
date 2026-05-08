'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '../../components/LoginScreen';
import { getCsrfHeaders } from '../../lib/csrf-client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: { email: string; password: string; name?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.detail || 'Credenciales incorrectas');
        return;
      }

      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      const session = await sessionResponse.json().catch(() => null);
      const role = session?.role ?? 'cashier';

      router.push(role === 'admin' ? '/dashboard' : '/salesRegister');
    } catch (err) {
      setError('No se puede conectar al servidor. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return <LoginScreen mode="login" onSubmit={handleSubmit} loading={loading} error={error} />;
}
