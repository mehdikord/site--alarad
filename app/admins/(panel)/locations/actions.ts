'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { id, str } from '@/lib/admin/form-data';

const validName = (n: string) => n.length >= 2 && n.length <= 100;

export async function saveProvinceAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(fd, 'name');
  if (!validName(name)) return fail('نام استان را درست وارد کنید.', { name: '۲ تا ۱۰۰ کاراکتر' });
  const pid = id(fd, 'id');
  const dup = await db.province.findFirst({ where: { name, ...(pid ? { id: { not: pid } } : {}) } });
  if (dup) return fail('استانی با این نام وجود دارد.', { name: 'تکراری است' });
  if (pid) {
    await db.province.update({ where: { id: pid }, data: { name } });
    return ok('نام استان ذخیره شد.');
  }
  const p = await db.province.create({ data: { name } });
  return ok('استان اضافه شد.', { redirect: `/admins/locations/${p.id}` });
}

export async function deleteProvinceAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const pid = id(fd, 'id');
  if (!pid) return fail('استان نامعتبر است.');
  const [addresses, orders] = await Promise.all([db.address.count({ where: { provinceId: pid } }), db.order.count({ where: { provinceId: pid } })]);
  if (addresses || orders) return fail('این استان در نشانی‌ها یا سفارش‌ها استفاده شده و قابل حذف نیست.');
  const cityUse = await db.city.count({ where: { provinceId: pid, OR: [{ addresses: { some: {} } }, { orders: { some: {} } }] } });
  if (cityUse) return fail('شهرهای این استان در نشانی‌ها یا سفارش‌ها استفاده شده‌اند.');
  await db.province.delete({ where: { id: pid } });
  return ok('استان و شهرهایش حذف شدند.', { redirect: '/admins/locations' });
}

export async function saveCityAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const provinceId = id(fd, 'provinceId');
  const cid = id(fd, 'id');
  const name = str(fd, 'name');
  if (!provinceId) return fail('استان نامعتبر است.');
  if (!validName(name)) return fail('نام شهر را درست وارد کنید.', { name: '۲ تا ۱۰۰ کاراکتر' });
  const dup = await db.city.findFirst({ where: { provinceId, name, ...(cid ? { id: { not: cid } } : {}) } });
  if (dup) return fail('این شهر در این استان وجود دارد.', { name: 'تکراری است' });
  if (cid) await db.city.update({ where: { id: cid }, data: { name } });
  else await db.city.create({ data: { provinceId, name } });
  return ok(cid ? 'نام شهر ذخیره شد.' : 'شهر اضافه شد.');
}

export async function deleteCityAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const cid = id(fd, 'id');
  if (!cid) return fail('شهر نامعتبر است.');
  const [addresses, orders] = await Promise.all([db.address.count({ where: { cityId: cid } }), db.order.count({ where: { cityId: cid } })]);
  if (addresses || orders) return fail('این شهر در نشانی‌ها یا سفارش‌ها استفاده شده و قابل حذف نیست.');
  await db.city.delete({ where: { id: cid } });
  return ok('شهر حذف شد.');
}
