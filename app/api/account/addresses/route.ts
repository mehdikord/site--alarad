import { db } from '@/lib/db';
import { bad, json, readJson } from '@/lib/http';
import { getUser } from '@/lib/auth/user';
import { validateReceiver } from '@/lib/services/checkout';
import { addressesOf } from '@/lib/services/addresses';
import { normalizePhone, toLatinDigits } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  return json({ ok: true, addresses: await addressesOf(user.id) });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  const b = await readJson<{
    title?: string; fullName?: string; phone?: string; provinceId?: number; cityId?: number;
    postalCode?: string; line1?: string; line2?: string; isDefault?: boolean;
  }>(req);
  const receiver = {
    fullName: String(b.fullName ?? ''), phone: String(b.phone ?? ''), provinceId: b.provinceId ?? null, cityId: b.cityId ?? null,
    postalCode: String(b.postalCode ?? ''), line1: String(b.line1 ?? ''), line2: b.line2 ?? '',
  };
  const { errors, provinceId, cityId } = await validateReceiver(receiver);
  if (Object.keys(errors).length) return bad('اطلاعات نشانی را بررسی کنید.', 422, { errors });
  const count = await db.address.count({ where: { userId: user.id } });
  const makeDefault = !!b.isDefault || count === 0;
  await db.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    await tx.address.create({
      data: {
        userId: user.id,
        title: String(b.title ?? '').trim().slice(0, 100) || null,
        receiverName: receiver.fullName.trim(),
        receiverPhone: normalizePhone(receiver.phone),
        provinceId: provinceId!,
        cityId: cityId!,
        postalCode: toLatinDigits(receiver.postalCode).replace(/\D/g, ''),
        address: receiver.line1.trim().slice(0, 500),
        unit: String(receiver.line2 ?? '').trim().slice(0, 255) || null,
        isDefault: makeDefault,
      },
    });
  });
  return json({ ok: true, addresses: await addressesOf(user.id), message: 'نشانی ذخیره شد.' });
}
