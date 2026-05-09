'use client';

import { useState, useEffect } from 'react';
import { backendFetch } from '@/lib/backend';

export interface Company {
  id: string;
  name: string;
  document?: string;
}

export interface Customer {
  id: string;
  name: string;
  document?: string;
  email?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  requires_cash: boolean;
  active: boolean;
}

export const useLookupData = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [companiesData, customersData, methodsData] = await Promise.all([
          backendFetch<Company[]>('/api/companies'),
          backendFetch<Customer[]>('/api/customers'),
          backendFetch<PaymentMethod[]>('/api/payment-methods'),
        ]);

        setCompanies(companiesData);
        setCustomers(customersData);
        setPaymentMethods(methodsData.filter((m) => m.active));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar catálogos';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { companies, customers, paymentMethods, loading, error };
};