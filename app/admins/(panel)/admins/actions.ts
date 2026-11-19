'use server';

import bcrypt from 'bcryptjs';
import { requireAdmin, startAdminSession } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { bool, id, str } from '@/lib/admin/form-data';
import { normalizePhone } from '@/lib/format';

const MIN_PASS = 8;

export async function createAdminAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(fd, 'name');
  const phone = normalizePhone(str(fd, 'phone'));
  const password = String(fd.get('password') ?? '');
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'نام را وارد کنید.';
  if (!/^09\d{9}$/.test(phone)) errors.phone = 'شمارهٔ موبایل معتبر نیست.';
  if (password.length < MIN_PASS) errors.password = `رمز عبور حداقل ${MIN_PASS} کاراکتر باشد.`;
  if (Object.keys(errors).length) return fail('اطلاعات را بررسی کنید.', errors);
  if (await db.admin.findUnique({ where: { phone } })) return fail('مدیری با این شماره وجود دارد.', { phone: 'تکراری است' });
  await db.admin.create({ data: { name, phone, password: await bcrypt.hash(password, 12), isActive: bool(fd, 'isActive') } });
  return ok('مدیر جدید اضافه شد.');
}

export async function updateAdminAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const adminId = id(fd, 'id');
  if (!adminId) return fail('مدیر نامعتبر است.');
  const name = str(fd, 'name');
  const phone = normalizePhone(str(fd, 'phone'));
  const password = String(fd.get('password') ?? '');
  const isActive = bool(fd, 'isActive');
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'نام را وارد کنید.';
  if (!/^09\d{9}$/.test(phone)) errors.phone = 'شمارهٔ موبایل معتبر نیست.';
  if (password && password.length < MIN_PASS) errors.password = `رمز عبور حداقل ${MIN_PASS} کاراکتر باشد.`;
  if (Object.keys(errors).length) return fail('اطلاعات را بررسی کنید.', errors);
  if (await db.admin.findFirst({ where: { phone, id: { not: adminId } } })) return fail('این شماره برای مدیر دیگری ثبت شده است.', { phone: 'تکراری است' });
  const isMe = adminId === me.id;
  if (isMe && !isActive) return fail('نمی‌توانید حساب خودتان را غیرفعال کنید.');
  if (!isActive) {
    const othersActive = await db.admin.count({ where: { isActive: true, id: { not: adminId } } });
    if (othersActive === 0) return fail('حداقل یک مدیر فعال باید باقی بماند.');
  }
  const updated = await db.admin.update({
    where: { id: adminId },
    data: { name, phone, isActive, ...(password ? { password: await bcrypt.hash(password, 12) } : {}) },
  });
  if (isMe && password) await startAdminSession(updated); // keep my session valid after a password change
  return ok('اطلاعات مدیر ذخیره شد.');
}

export async function deleteAdminAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const adminId = id(fd, 'id');
  if (!adminId) return fail('مدیر نامعتبر است.');
  if (adminId === me.id) return fail('نمی‌توانید حساب خودتان را حذف کنید.');
  const othersActive = await db.admin.count({ where: { isActive: true, id: { not: adminId } } });
  if (othersActive === 0) return fail('حداقل یک مدیر فعال باید باقی بماند.');
  await db.admin.delete({ where: { id: adminId } });
  return ok('مدیر حذف شد.', { redirect: '/admins/admins' });
}

export async function changeMyPasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const current = String(fd.get('current') ?? '');
  const next = String(fd.get('next') ?? '');
  const confirm = String(fd.get('confirm') ?? '');
  const admin = await db.admin.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(current, admin.password))) return fail('رمز عبور فعلی اشتباه است.', { current: 'اشتباه است' });
  if (next.length < MIN_PASS) return fail(`رمز جدید حداقل ${MIN_PASS} کاراکتر باشد.`, { next: `حداقل ${MIN_PASS} کاراکتر` });
  if (next !== confirm) return fail('تکرار رمز جدید مطابقت ندارد.', { confirm: 'مطابقت ندارد' });
  const updated = await db.admin.update({ where: { id: me.id }, data: { password: await bcrypt.hash(next, 12) } });
  await startAdminSession(updated);
  return ok('رمز عبور شما تغییر کرد.');
}
