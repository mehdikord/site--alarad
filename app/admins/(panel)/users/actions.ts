'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { bool, id, optStr, str } from '@/lib/admin/form-data';
import { normalizePhone } from '@/lib/format';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const phone = normalizePhone(str(fd, 'phone'));
  const email = optStr(fd, 'email');
  const errors: Record<string, string> = {};
  if (!/^09\d{9}$/.test(phone)) errors.phone = 'شمارهٔ موبایل معتبر نیست.';
  if (email && !EMAIL.test(email)) errors.email = 'ایمیل معتبر نیست.';
  if (Object.keys(errors).length) return fail('اطلاعات را بررسی کنید.', errors);
  if (await db.user.findUnique({ where: { phone } })) return fail('کاربری با این شماره وجود دارد.', { phone: 'تکراری است' });
  const user = await db.user.create({ data: { phone, name: optStr(fd, 'name'), email, isActive: bool(fd, 'isActive') } });
  return ok('کاربر ساخته شد.', { redirect: `/admins/users/${user.id}` });
}

export async function updateUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = id(fd, 'id');
  if (!userId) return fail('کاربر نامعتبر است.');
  const phone = normalizePhone(str(fd, 'phone'));
  const email = optStr(fd, 'email');
  const errors: Record<string, string> = {};
  if (!/^09\d{9}$/.test(phone)) errors.phone = 'شمارهٔ موبایل معتبر نیست.';
  if (email && !EMAIL.test(email)) errors.email = 'ایمیل معتبر نیست.';
  if (Object.keys(errors).length) return fail('اطلاعات را بررسی کنید.', errors);
  const dup = await db.user.findFirst({ where: { phone, id: { not: userId } } });
  if (dup) return fail('این شماره برای کاربر دیگری ثبت شده است.', { phone: 'تکراری است' });
  await db.user.update({ where: { id: userId }, data: { phone, name: optStr(fd, 'name'), email, isActive: bool(fd, 'isActive') } });
  return ok('اطلاعات کاربر ذخیره شد.');
}
