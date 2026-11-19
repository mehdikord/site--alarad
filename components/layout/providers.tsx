'use client';

import { useEffect } from 'react';
import { useCart, useAuth } from '@/lib/store';

/** Rehydrate the persisted cart after mount (no hydration flash) and load the signed-in user. */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCart.persist.rehydrate();
    void useAuth.getState().refresh();
  }, []);

  return <>{children}</>;
}
