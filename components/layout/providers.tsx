'use client';

import { useEffect } from 'react';
import { useCart, useAuth, useCatalog } from '@/lib/store';
import { useOrders } from '@/lib/store/orders';

/** Rehydrate persisted stores after mount — keeps SSR markup identical (no hydration flash). */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCart.persist.rehydrate();
    useAuth.persist.rehydrate();
    useOrders.persist.rehydrate();
    useCatalog.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
