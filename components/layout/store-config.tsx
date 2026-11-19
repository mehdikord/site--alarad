'use client';

import * as React from 'react';

export interface StoreConfig {
  freeShippingThreshold: number;
  taxRate: number;
}

const Ctx = React.createContext<StoreConfig>({ freeShippingThreshold: 500_000, taxRate: 9 });

/** store settings (from the DB) needed by client components: cart meter, tax estimate… */
export function StoreConfigProvider({ value, children }: { value: StoreConfig; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStoreConfig = () => React.useContext(Ctx);
