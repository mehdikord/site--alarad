'use server';

import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { startAdminSession } from '@/lib/auth/admin';
import { normalizePhone } from '@/lib/format';
import { fail, ok, type ActionState } from '@/lib/admin/action';

// constant-time-ish: compare against a dummy hash when the phone is unknown
const DUMMY_HASH = '$2b$12$RbSKJ5BUW5cZdQUDKX7jg.wsWgZKi1liZSh8Wvzl./B6zn.gTxdly';

// naive in-memory brute-force guard (per process)
const attempts = new Map<string, { n: number; until: number }>();

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const phone = normalizePhone(String(fd.get('phone') ?? ''));
  const password = String(fd.get('password') ?? '');
  const next = String(fd.get('next') ?? '');
  const errors: Record<string, string> = {};
  if (!/^09\d{9}$/.test(phone)) errors.phone = 'شمارهٔ موبایل معتبر نیست.';
  if (password.length < 4) errors.password = 'رمز عبور را وارد کنید.';
  if (Object.keys(errors).length) return fail('اطلاعات ورود را بررسی کنید.', errors);

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const key = `${ip}:${phone}`;
  const a = attempts.get(key);
  if (a && a.until > Date.now()) return fail('تلاش‌های ناموفق زیاد بود؛ چند دقیقه بعد دوباره امتحان کنید.');

  const admin = await db.admin.findUnique({ where: { phone } });
  const valid = admin ? await bcrypt.compare(password, admin.password) : await bcrypt.compare(password, DUMMY_HASH);
  if (!admin || !valid || !admin.isActive) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(key, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
    return fail(admin && !admin.isActive ? 'این حساب غیرفعال شده است.' : 'شماره موبایل یا رمز عبور اشتباه است.');
  }
  attempts.delete(key);
  await db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await startAdminSession(admin);
  const safeNext = next.startsWith('/admins') && !next.startsWith('/admins/login') ? next : '/admins';
  return ok(`خوش آمدید، ${admin.name}`, { redirect: safeNext });
}
