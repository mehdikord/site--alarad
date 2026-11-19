import { prisma, log } from './client';

export async function couponSeeder() {
  const coupons = [
    { code: 'ALARAD10', title: '۱۰٪ تخفیف خرید اول', type: 'percent' as const, value: 10 },
    { code: 'WELCOME15', title: '۱۵٪ تخفیف خوش‌آمدگویی', type: 'percent' as const, value: 15, maxDiscount: 150_000 },
    { code: 'SPRING50', title: '۵۰٬۰۰۰ تومان تخفیف', type: 'fixed' as const, value: 50_000, minOrderAmount: 200_000 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  log('CouponSeeder', `${coupons.length} coupons`);
}
