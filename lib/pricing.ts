import type { CartItem, CartTotals, ShippingMethod } from '@/lib/types';
import { COUPONS, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '@/lib/data/taxonomy';

export interface CouponResult {
  ok: boolean;
  code?: string;
  amount: number;
  message: string;
  label?: string;
}

export function subtotalOf(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}

export function itemCountOf(items: CartItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function applyCoupon(code: string, subtotal: number): CouponResult {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, amount: 0, message: 'کد تخفیف را وارد کنید.' };
  const coupon = COUPONS[clean];
  if (!coupon) return { ok: false, amount: 0, message: 'این کد تخفیف معتبر نیست یا منقضی شده است.' };
  let amount =
    coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.max) amount = Math.min(amount, coupon.max);
  if (amount >= subtotal) amount = Math.round(subtotal * 0.9);
  return { ok: true, code: clean, amount, message: coupon.label, label: coupon.label };
}

export function shippingCostOf(method: ShippingMethod | null, subtotal: number) {
  if (!method) return 0;
  if (method.id === 'pickup') return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return method.cost;
}

export function computeTotals(
  items: CartItem[],
  opts: { shipping?: ShippingMethod | null; coupon?: { code: string; amount: number } | null } = {},
): CartTotals {
  const subtotal = subtotalOf(items);
  const shipping = shippingCostOf(opts.shipping ?? null, subtotal);
  const discount = opts.coupon?.amount ?? 0;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE);
  const grandTotal = Math.max(taxable + tax + shipping, 0);
  return {
    subtotal,
    shipping,
    discount,
    tax,
    grandTotal,
    itemCount: itemCountOf(items),
    freeShippingGap: Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0),
  };
}

export const freeShippingProgress = (subtotal: number) =>
  Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
