'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CashScreen } from '../../components/CashScreen';
import { useCash } from '../../lib/hooks/useCash';
import { FEATURE_FLAGS } from '../../lib/feature-flags';
import LegacyCashPage from './LegacyCashPage';

export default function CashManagementPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (!FEATURE_FLAGS.USE_CASH_HOOK) {
    return <LegacyCashPage />;
  }

  return <NewCashManagement />;
}

function NewCashManagement() {
  const { session, loading, actionLoading, error, openCash, closeCash, recordWithdrawal } = useCash();

  const handleOpen = async (opening_balance: number): Promise<boolean> => {
    const ok = await openCash(opening_balance);
    if (ok) {
      toast.success('Caja abierta');
    } else {
      toast.error('No se pudo abrir la caja');
    }
    return ok;
  };

  const handleClose = async (): Promise<boolean> => {
    const ok = await closeCash();
    if (ok) {
      toast.success('Caja cerrada');
    } else {
      toast.error('No se pudo cerrar la caja');
    }
    return ok;
  };

  const handleWithdraw = async (amount: number, description: string): Promise<boolean> => {
    const ok = await recordWithdrawal(amount, description);
    if (ok) {
      toast.success('Retiro registrado');
    } else {
      toast.error('No se pudo registrar el retiro');
    }
    return ok;
  };

  return (
    <CashScreen
      session={session}
      loading={loading}
      actionLoading={actionLoading}
      error={error}
      onOpen={handleOpen}
      onClose={handleClose}
      onWithdraw={handleWithdraw}
    />
  );
}
