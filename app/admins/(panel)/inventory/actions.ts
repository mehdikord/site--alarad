'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

const schema = z.array(z.object({ id: z.number().int().positive(), stock: z.number().int().min(0).max(4_294_967_295) })).min(1).max(500);

export async function saveStock(changes: { id: number; stock: number }[]): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const parsed = schema.safeParse(changes);
  if (!parsed.success) return { ok: false, message: 'مقادیر موجودی معتبر نیستند (فقط عدد صحیح ۰ یا بیشتر).' };
  const ids = parsed.data.map((c) => BigInt(c.id));
  const found = await db.productVariant.count({ where: { id: { in: ids } } });
  if (found !== ids.length) return { ok: false, message: 'برخی تنوع‌ها پیدا نشدند؛ صفحه را تازه کنید.' };
  await db.$transaction(parsed.data.map((c) => db.productVariant.update({ where: { id: BigInt(c.id) }, data: { stock: c.stock } })));
  return { ok: true, message: `موجودی ${new Intl.NumberFormat('fa-IR').format(parsed.data.length)} تنوع به‌روزرسانی شد.` };
}
