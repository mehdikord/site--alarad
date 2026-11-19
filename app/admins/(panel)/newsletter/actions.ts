'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { id } from '@/lib/admin/form-data';

export async function toggleSubscriberAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const sid = id(fd, 'id');
  if (!sid) return fail('مشترک نامعتبر است.');
  const s = await db.newsletterSubscriber.findUnique({ where: { id: sid } });
  if (!s) return fail('مشترک پیدا نشد.');
  await db.newsletterSubscriber.update({ where: { id: sid }, data: { isActive: !s.isActive } });
  return ok(s.isActive ? 'اشتراک غیرفعال شد.' : 'اشتراک فعال شد.');
}

export async function deleteSubscriberAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const sid = id(fd, 'id');
  if (!sid) return fail('مشترک نامعتبر است.');
  await db.newsletterSubscriber.delete({ where: { id: sid } }).catch(() => null);
  return ok('مشترک حذف شد.');
}
