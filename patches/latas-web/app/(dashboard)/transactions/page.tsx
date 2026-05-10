'use client';

import { TransactionsScreen } from '@/components/TransactionsScreen';
import { useTransactions }    from '@/lib/hooks/useTransactions';

export default function TransactionsPage() {
  const {
    transactions,
    loading,
    error,
    cancelTransaction,
  } = useTransactions();

  return (
    <TransactionsScreen
      transactions={transactions}
      loading={loading}
      error={error}
      onCancel={cancelTransaction}
    />
  );
}
