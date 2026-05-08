'use client';

'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { SaleScreen } from '../../components/SaleScreen';
import type { SaleCreateRequest } from '../../lib/hooks/useSales';
import { useSales } from '../../lib/hooks/useSales';
import { useCash } from '../../lib/hooks/useCash';
import { useLookupData } from '../../lib/hooks/useLookupData';
import { useSessionInfo } from '../../lib/hooks/useSessionInfo';
import { FEATURE_FLAGS } from '../../lib/feature-flags';
import LegacySalesForm from './LegacySalesForm';

function ScreenSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-8 pb-[100px] max-w-[1400px] mx-auto">
      <div className="rounded-lg bg-white h-96 animate-pulse" />
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-white h-20 animate-pulse" />
        <div className="rounded-lg bg-white h-20 animate-pulse" />
        <div className="rounded-lg bg-white h-20 animate-pulse" />
      </div>
    </div>
  );
}

export default function SalesRegisterPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (!FEATURE_FLAGS.USE_SALES_HOOK) {
    return <LegacySalesForm />;
  }

  return <NewSalesRegister />;
}

function NewSalesRegister() {
  const router = useRouter();
  const { session: cashSession } = useCash();
  const { companies, customers, paymentMethods, loading: lookupsLoading } = useLookupData();
  const { session } = useSessionInfo();
  const { creating, error, createSale, reset } = useSales();

  if (lookupsLoading) {
    return <ScreenSkeleton />;
  }

  const handleSubmit = async (payload: SaleCreateRequest) => {
    const result = await createSale(payload);
    if (result) {
      toast.success(`Venta ${result.document_number} registrada`);
      reset();
      router.refresh();
    }
  };

  return (
    <SaleScreen
      cashOpen={cashSession?.status === 'open'}
      openCash={() => router.push('/cash-management')}
      companies={companies}
      customers={customers}
      paymentMethods={paymentMethods}
      defaultCompanyId={session?.default_company_id}
      submitting={creating}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
