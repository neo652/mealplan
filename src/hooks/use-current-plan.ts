'use client';

import { useCallback, useEffect, useState } from 'react';
import { LOCAL_STORAGE_PLAN_KEY } from '@/lib/constants';

export type CurrentPlan = { id: string; name: string } | null;

function read(): CurrentPlan {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function useCurrentPlan() {
  const [plan, setPlan] = useState<CurrentPlan>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setPlan(read());
    setIsHydrated(true);
  }, []);

  const selectPlan = useCallback((next: { id: string; name: string }) => {
    window.localStorage.setItem(LOCAL_STORAGE_PLAN_KEY, JSON.stringify(next));
    setPlan(next);
  }, []);

  const clearPlan = useCallback(() => {
    window.localStorage.removeItem(LOCAL_STORAGE_PLAN_KEY);
    setPlan(null);
  }, []);

  return { plan, isHydrated, selectPlan, clearPlan };
}
