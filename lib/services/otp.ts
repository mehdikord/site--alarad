import 'server-only';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { sendSms, smsIsFake } from '@/lib/sms';

const CODE_TTL_MS = 2 * 60_000;
const RESEND_AFTER_MS = 60_000;
const MAX_PER_HOUR = 6;
const MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 5;

export async function requestOtp(phone: string, ip: string | null) {
  const last = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_AFTER_MS) {
    const wait = Math.ceil((RESEND_AFTER_MS - (Date.now() - last.createdAt.getTime())) / 1000);
    return { ok: false as const, message: `برای ارسال دوباره ${wait} ثانیه صبر کنید.`, wait };
  }
  const hourly = await db.otpCode.count({ where: { phone, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (hourly >= MAX_PER_HOUR) return { ok: false as const, message: 'درخواست‌های زیادی ثبت شد؛ کمی بعد دوباره تلاش کنید.' };

  const code = String(randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH));
  await db.otpCode.create({
    data: { phone, code: await bcrypt.hash(code, 8), ip, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  await sendSms(phone, `کد ورود شما به الاردشاپ: ${code}`);
  return {
    ok: true as const,
    expiresIn: CODE_TTL_MS / 1000,
    // only exposed while SMS is not really sent (development / log driver)
    devCode: smsIsFake() && process.env.NODE_ENV !== 'production' ? code : undefined,
  };
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await db.otpCode.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return { ok: false as const, message: 'کد منقضی شده است؛ کد تازه دریافت کنید.' };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false as const, message: 'تعداد تلاش‌ها زیاد بود؛ کد تازه دریافت کنید.' };
  const valid = await bcrypt.compare(code, otp.code);
  if (!valid) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, message: 'کد تأیید اشتباه است.' };
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return { ok: true as const };
}
