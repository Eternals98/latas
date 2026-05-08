import { useEffect, useState } from 'react';

export type Company = {
  id: string;
  name: string;
};

export type Customer = {
  id: string;
  name: string;
  document?: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  requires_cash: boolean;
};

type UseLookupDataReturn = {
  companies: Company[];
  customers: Customer[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
};

export function useLookupData(): UseLookupDataReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [companiesRes, methodsRes] = await Promise.all([
          fetch('/api/bff/companies', { cache: 'no-store' }),
          fetch('/api/bff/payment-methods', { cache: 'no-store' }),
        ]);

        const [companiesData, methodsData] = await Promise.all([
          companiesRes.json(),
          methodsRes.json(),
        ]);

        if (!companiesRes.ok) {
          throw new Error(companiesData.detail || 'Error loading companies');
        }

        if (!methodsRes.ok) {
          throw new Error(methodsData.detail || 'Error loading payment methods');
        }

        setCompanies(companiesData as Company[]);
        setPaymentMethods(methodsData as PaymentMethod[]);
        setCustomers([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading lookup data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return {
    companies,
    customers,
    paymentMethods,
    loading,
    error,
  };
}
