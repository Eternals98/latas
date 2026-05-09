'use client';

import { useState, useEffect } from 'react';
import { backendFetch } from '@/lib/backend';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier';
  company_id?: string;
  default_company_id?: string;
  created_at: string;
  last_login?: string;
}

export const useSessionInfo = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await backendFetch<UserProfile>('/api/auth/profile');
        setProfile(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return { profile, loading, error };
};