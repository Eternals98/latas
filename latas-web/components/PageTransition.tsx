'use client';

import { ReactNode } from 'react';

export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <div className="duration-500 animate-in fade-in slide-in-from-bottom-4">
      {children}
    </div>
  );
};