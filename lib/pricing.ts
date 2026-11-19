import type { CartItem, CartTotals } from '@/lib/types';

/** Client-side estimate only — the server re-prices everything at checkout (lib/services/pricing.ts). */
export function subtotalOf(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}

export function itemCountOf(items: CartItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function computeTotals(
  items: CartItem[],
  opts: { shipping?: number; discount?: number; taxRate?: number; freeShippingThreshold?: number } = {},
): CartTotals {
  const subtotal = subtotalOf(items);
  const shipping = opts.shipping ?? 0;
  const discount = Math.min(opts.discount ?? 0, subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round((taxable * (opts.taxRate ?? 0)) / 100);
  return {
    subtotal,
    shipping,
    discount,
    tax,
    grandTotal: taxable + tax + shipping,
    itemCount: itemCountOf(items),
    freeShippingGap: Math.max((opts.freeShippingThreshold ?? 0) - subtotal, 0),
  };
}

export const freeShippingProgress = (subtotal: number, threshold: number) =>
  threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
