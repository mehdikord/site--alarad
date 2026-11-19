import { db } from '@/lib/db';
import { bad, json, readJson } from '@/lib/http';
import { normalizePhone, toLatinDigits } from '@/lib/format';
import { verifyOtp } from '@/lib/services/otp';
import { publicUser, startUserSession } from '@/lib/auth/user';

export async function POST(req: Request) {
  const body = await readJson<{ phone?: string; code?: string; name?: string }>(req);
  const phone = normalizePhone(String(body.phone ?? ''));
  const code = toLatinDigits(String(body.code ?? '')).replace(/\D/g, '');
  const name = String(body.name ?? '').trim().slice(0, 255);
  if (!/^09\d{9}$/.test(phone)) return bad('شمارهٔ همراه معتبر نیست.', 422);
  if (code.length < 4) return bad('کد تأیید را کامل وارد کنید.', 422);

  const result = await verifyOtp(phone, code);
  if (!result.ok) return bad(result.message, 422);

  const now = new Date();
  const existing = await db.user.findUnique({ where: { phone } });
  if (existing && !existing.isActive) return bad('حساب کاربری شما غیرفعال شده است؛ با پشتیبانی تماس بگیرید.', 403);
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: { lastLoginAt: now, phoneVerifiedAt: existing.phoneVerifiedAt ?? now, name: existing.name || name || null },
      })
    : await db.user.create({ data: { phone, name: name || null, phoneVerifiedAt: now, lastLoginAt: now } });

  await startUserSession(user.id);
  return json({ ok: true, user: publicUser(user), isNew: !existing });
}
