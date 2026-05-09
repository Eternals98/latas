'use client';

import { useEffect } from 'react';
import { Icon, Button } from '@/components/Primitives';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen p-8 bg-paper-100 place-items-center">
      <div className="max-w-md text-center">
        <Icon name="alertCircle" size={64} className="mx-auto mb-4 text-coral-600" />
        <h1 className="mb-2 text-4xl font-bold font-display text-ink-900">¡Oops!</h1>
        <p className="mb-2 text-slate-600">
          Algo salió mal. Por favor intenta de nuevo.
        </p>
        <p className="p-4 mb-8 text-xs rounded-lg text-slate-500 bg-coral-50">
          {error.message}
        </p>
        <Button
          variant="accent"
          onClick={reset}
          className="w-full"
        >
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}