import { db, toId } from '@/lib/db';
import { bad, json } from '@/lib/http';
import { getUser } from '@/lib/auth/user';
import { addressesOf } from '@/lib/services/addresses';

async function owned(idRaw: string) {
  const user = await getUser();
  if (!user) return { error: bad('ابتدا وارد حساب شوید.', 401) } as const;
  const id = toId(idRaw);
  const address = id ? await db.address.findFirst({ where: { id, userId: user.id } }) : null;
  if (!address) return { error: bad('نشانی پیدا نشد.', 404) } as const;
  return { user, address } as const;
}

/** make default */
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await owned((await params).id);
  if ('error' in r) return r.error;
  await db.$transaction([
    db.address.updateMany({ where: { userId: r.user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: r.address.id }, data: { isDefault: true } }),
  ]);
  return json({ ok: true, addresses: await addressesOf(r.user.id), message: 'نشانی پیش‌فرض تغییر کرد.' });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await owned((await params).id);
  if ('error' in r) return r.error;
  await db.address.delete({ where: { id: r.address.id } }); // orders keep their own snapshot (address_id → NULL)
  if (r.address.isDefault) {
    const next = await db.address.findFirst({ where: { userId: r.user.id }, orderBy: { updatedAt: 'desc' } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return json({ ok: true, addresses: await addressesOf(r.user.id), message: 'نشانی حذف شد.' });
}
