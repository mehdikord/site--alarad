import 'server-only';
import type { Coupon, ShippingMethod } from '@prisma/client';
import { db } from '@/lib/db';

export interface CouponCheck {
  ok: boolean;
  message: string;
  amount: number;
  coupon?: Coupon;
}

/** Validates a coupon against a subtotal (+ optional user for per-user limits). */
export async function checkCoupon(code: string, subtotal: number, userId?: bigint | null): Promise<CouponCheck> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, amount: 0, message: 'کد تخفیف را وارد کنید.' };
  const coupon = await db.coupon.findUnique({ where: { code: clean } });
  const now = new Date();
  if (!coupon || !coupon.isActive) return { ok: false, amount: 0, message: 'این کد تخفیف معتبر نیست یا منقضی شده است.' };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, amount: 0, message: 'زمان استفاده از این کد هنوز نرسیده است.' };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, amount: 0, message: 'مهلت استفاده از این کد تمام شده است.' };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, amount: 0, message: 'ظرفیت استفاده از این کد تکمیل شده است.' };
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount)
    return {
      ok: false,
      amount: 0,
      message: `این کد برای خریدهای بالای ${new Intl.NumberFormat('fa-IR').format(coupon.minOrderAmount)} تومان است.`,
    };
  if (userId && coupon.perUserLimit !== null) {
    const used = await db.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) return { ok: false, amount: 0, message: 'شما قبلاً از این کد استفاده کرده‌اید.' };
  }
  let amount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) amount = Math.min(amount, coupon.maxDiscount);
  amount = Math.min(amount, subtotal);
  return { ok: true, amount, message: coupon.title, coupon };
}

export function shippingCostFor(method: Pick<ShippingMethod, 'cost' | 'freeShippingThreshold'>, subtotal: number) {
  if (method.freeShippingThreshold !== null && subtotal >= method.freeShippingThreshold) return 0;
  return method.cost;
}

export function totalsOf(subtotal: number, discount: number, shipping: number, taxRate: number) {
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round((taxable * taxRate) / 100);
  return { subtotal, discount, shipping, tax, total: taxable + tax + shipping };
}

/** shipping methods usable for a province (no province rows = nationwide) */
export async function shippingMethodsFor(provinceId: bigint | null) {
  const methods = await db.shippingMethod.findMany({
    where: { isActive: true },
    include: { provinces: { select: { provinceId: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  return methods.filter(
    (m) => m.provinces.length === 0 || (provinceId !== null && m.provinces.some((p) => p.provinceId === provinceId)),
  );
}
