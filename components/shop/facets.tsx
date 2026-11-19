'use client';

import * as React from 'react';
import type { ColorOption } from '@/lib/types';
import type { PriceBounds } from '@/lib/shop';

export interface ShopFacets {
  colors: ColorOption[];
  sizes: { key: string; label: string }[];
  bounds: PriceBounds;
}

const Ctx = React.createContext<ShopFacets>({ colors: [], sizes: [], bounds: { min: 0, max: 1_000_000 } });

/** filter options loaded from the DB, shared by the toolbar, chips and filter panel */
export function ShopFacetsProvider({ value, children }: { value: ShopFacets; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFacets = () => React.useContext(Ctx);
