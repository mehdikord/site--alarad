'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { toLatinDigits } from '@/lib/format';

export async function saveSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const rows = await db.setting.findMany();
  const errors: Record<string, string> = {};
  const updates: { key: string; value: string }[] = [];
  for (const r of rows) {
    const field = `s_${r.key}`;
    if (r.type === 'boolean') {
      updates.push({ key: r.key, value: fd.get(field) === 'on' ? 'true' : 'false' });
      continue;
    }
    if (!fd.has(field)) continue;
    let value = String(fd.get(field) ?? '').trim();
    if (r.type === 'number') {
      value = toLatinDigits(value).replace(/[,٬\s]/g, '');
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
        errors[field] = 'عدد معتبر وارد کنید.';
        continue;
      }
      if (r.key === 'tax_rate' && Number(value) > 100) {
        errors[field] = 'حداکثر ۱۰۰';
        continue;
      }
    }
    if (r.key === 'order_code_prefix' && !/^[A-Z]{1,6}$/.test(value.toUpperCase())) {
      errors[field] = '۱ تا ۶ حرف انگلیسی';
      continue;
    }
    updates.push({ key: r.key, value: r.key === 'order_code_prefix' ? value.toUpperCase() : value });
  }
  if (Object.keys(errors).length) return fail('برخی مقادیر نامعتبرند.', errors);
  await db.$transaction(updates.map((u) => db.setting.update({ where: { key: u.key }, data: { value: u.value } })));
  return ok('تنظیمات ذخیره شد.');
}
