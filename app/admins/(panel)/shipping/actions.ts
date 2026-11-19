'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { bool, id, ids, int, optInt, optStr, str } from '@/lib/admin/form-data';

function read(fd: FormData) {
  const data = {
    code: str(fd, 'code').toLowerCase(),
    title: str(fd, 'title'),
    description: optStr(fd, 'description'),
    cost: int(fd, 'cost'),
    freeShippingThreshold: optInt(fd, 'freeShippingThreshold'),
    eta: optStr(fd, 'eta'),
    supportsCod: bool(fd, 'supportsCod'),
    isActive: bool(fd, 'isActive'),
    sortOrder: int(fd, 'sortOrder'),
  };
  const errors: Record<string, string> = {};
  if (!/^[a-z0-9_-]{2,50}$/.test(data.code)) errors.code = 'فقط حروف کوچک انگلیسی، عدد، - و _';
  if (data.title.length < 2) errors.title = 'عنوان را وارد کنید.';
  return { data, errors, provinces: ids(fd, 'provinces') };
}

async function syncProvinces(methodId: bigint, provinces: bigint[]) {
  await db.$transaction([
    db.shippingMethodProvince.deleteMany({ where: { shippingMethodId: methodId } }),
    db.shippingMethodProvince.createMany({ data: provinces.map((provinceId) => ({ shippingMethodId: methodId, provinceId })), skipDuplicates: true }),
  ]);
}

export async function createShippingAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const { data, errors, provinces } = read(fd);
  if (Object.keys(errors).length) return fail('اطلاعات را بررسی کنید.', errors);
  if (await db.shippingMethod.findUnique({ where: { code: data.code } })) return fail('این کد قبلاً استفاده شده است.', { code: 'تکراری است' });
  const m = await db.shippingMethod.create({ data });
  await syncProvinces(m.id, provinces);
  return ok('روش ارسال ساخته شد.', { redirect: `/admins/shipping/${m.id}` });
}

export async function updateShippingAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const methodId = id(fd, 'id');
  if (!methodId) return fail('روش ارسال نامعتبر است.');
  const { data, errors, provinces } = read(fd);
  if (Object.keys(errors).length) return fail('اطلاعات را بررسی کنید.', errors);
  if (await db.shippingMethod.findFirst({ where: { code: data.code, id: { not: methodId } } })) return fail('این کد قبلاً استفاده شده است.', { code: 'تکراری است' });
  await db.shippingMethod.update({ where: { id: methodId }, data });
  await syncProvinces(methodId, provinces);
  return ok('روش ارسال ذخیره شد.');
}

export async function deleteShippingAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const methodId = id(fd, 'id');
  if (!methodId) return fail('روش ارسال نامعتبر است.');
  const used = await db.order.count({ where: { shippingMethodId: methodId } });
  if (used > 0) {
    await db.shippingMethod.update({ where: { id: methodId }, data: { isActive: false } });
    return ok('این روش در سفارش‌ها استفاده شده؛ به‌جای حذف غیرفعال شد.', { redirect: '/admins/shipping' });
  }
  await db.shippingMethod.delete({ where: { id: methodId } });
  return ok('روش ارسال حذف شد.', { redirect: '/admins/shipping' });
}
