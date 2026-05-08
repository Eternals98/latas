'use client';

import { useState, useCallback, useEffect } from 'react';

export function useTweaks(initial: any) {
  const [tweaks, setTweaks] = useState(() => {
    if (typeof window === 'undefined') return initial;
    const saved = localStorage.getItem('axentria-tweaks');
    return saved ? { ...initial, ...JSON.parse(saved) } : initial;
  });

  const setTweak = useCallback((key: string, value: any) => {
    setTweaks((prev: any) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('axentria-tweaks', JSON.stringify(next));
      return next;
    });
  }, []);

  return [tweaks, setTweak] as const;
}
