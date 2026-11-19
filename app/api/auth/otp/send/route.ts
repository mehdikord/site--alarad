import { bad, clientIp, json, readJson } from '@/lib/http';
import { normalizePhone } from '@/lib/format';
import { requestOtp } from '@/lib/services/otp';

export async function POST(req: Request) {
  const body = await readJson<{ phone?: string }>(req);
  const phone = normalizePhone(String(body.phone ?? ''));
  if (!/^09\d{9}$/.test(phone)) return bad('شمارهٔ همراه معتبر نیست.', 422);
  const result = await requestOtp(phone, await clientIp());
  if (!result.ok) return bad(result.message, 429);
  return json({ ok: true, phone, expiresIn: result.expiresIn, devCode: result.devCode });
}
