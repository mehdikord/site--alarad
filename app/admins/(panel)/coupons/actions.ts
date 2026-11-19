'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { bool, id, int, optDate, optInt, str } from '@/lib/admin/form-data';

function read(fd: FormData) {
  const code = str(fd, 'code').toUpperCase().replace(/\s+/g, '');
  const type = str(fd, 'type') === 'fixed' ? ('fixed' as const) : ('percent' as const);
  const data = {
    code,
    title: str(fd, 'title'),
    type,
    value: int(fd, 'value'),
    maxDiscount: optInt(fd, 'maxDiscount'),
    minOrderAmount: optInt(fd, 'minOrderAmount'),
    usageLimit: optInt(fd, 'usageLimit'),
    perUserLimit: optInt(fd, 'perUserLimit'),
    startsAt: optDate(fd, 'startsAt'),
    expiresAt: optDate(fd, 'expiresAt'),
    isActive: bool(fd, 'isActive'),
  };
  const errors: Record<string, string> = {};
  if (!/^[A-Z0-9_-]{3,50}$/.test(code)) errors.code = 'فقط حروف انگلیسی، عدد، - و _ (۳ تا ۵۰ کاراکتر)';
  if (data.title.length < 2) errors.title = 'عنوان را وارد کنید.';
  if (data.value <= 0) errors.value = 'مقدار باید بیشتر از صفر باشد.';
  if (type === 'percent' && data.value > 100) errors.value = 'درصد نمی‌تواند بیشتر از ۱۰۰ باشد.';
  if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) errors.expiresAt = 'تاریخ پایان باید بعد از شروع باشد.';
  return { data, errors };
}

export async function createCouponAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const { data, errors } = read(fd);
  if (Object.keys(errors).length) return fail('اطلاعات کد تخفیف را بررسی کنید.', errors);
  if (await db.coupon.findUnique({ where: { code: data.code } })) return fail('این کد قبلاً ثبت شده است.', { code: 'تکراری است' });
  const c = await db.coupon.create({ data });
  return ok('کد تخفیف ساخته شد.', { redirect: `/admins/coupons/${c.id}` });
}

export async function updateCouponAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const couponId = id(fd, 'id');
  if (!couponId) return fail('کد تخفیف نامعتبر است.');
  const { data, errors } = read(fd);
  if (Object.keys(errors).length) return fail('اطلاعات کد تخفیف را بررسی کنید.', errors);
  const dup = await db.coupon.findFirst({ where: { code: data.code, id: { not: couponId } } });
  if (dup) return fail('این کد قبلاً ثبت شده است.', { code: 'تکراری است' });
  await db.coupon.update({ where: { id: couponId }, data });
  return ok('کد تخفیف ذخیره شد.');
}

export async function deleteCouponAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const couponId = id(fd, 'id');
  if (!couponId) return fail('کد تخفیف نامعتبر است.');
  const used = await db.couponUsage.count({ where: { couponId } });
  if (used > 0) {
    await db.coupon.update({ where: { id: couponId }, data: { isActive: false } });
    return ok('این کد سابقهٔ استفاده دارد؛ به‌جای حذف غیرفعال شد.', { redirect: '/admins/coupons' });
  }
  await db.coupon.delete({ where: { id: couponId } });
  return ok('کد تخفیف حذف شد.', { redirect: '/admins/coupons' });
}
