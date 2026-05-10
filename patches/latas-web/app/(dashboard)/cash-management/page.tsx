'use client';

import { CashScreen } from '@/components/CashScreen';
import { useCash }    from '@/lib/hooks/useCash';

export default function CashManagementPage() {
  const {
    session,
    loading,
    actionLoading,
    error,
    openCash,
    closeCash,
    recordWithdrawal,
  } = useCash();

  return (
    <CashScreen
      session={session}
      loading={loading}
      actionLoading={actionLoading}
      error={error}
      onOpen={openCash}
      onClose={closeCash}
      onWithdraw={recordWithdrawal}
    />
  );
}
