'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SaleScreen } from '@/components/SalesScreen';
import { useSales } from '@/lib/hooks/useSales';
import { useCash } from '@/lib/hooks/useCash';
import { useLookupData } from '@/lib/hooks/useLookupData';
import { useSessionInfo } from '@/lib/hooks/useSessionInfo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function SalesRegisterPage() {
  const router = useRouter();
  const { session: cashSession } = useCash();
  const { companies, customers, paymentMethods, loading: lookupsLoading } = useLookupData();
  const { profile } = useSessionInfo();
  const { creating, error, createSale, reset } = useSales();

  if (lookupsLoading) {
    return <div className="p-8 animate-pulse">Cargando catálogos...</div>;
  }

  const handleSubmit = async (payload: any) => {
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
      defaultCompanyId={profile?.company_id}
      submitting={creating}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}