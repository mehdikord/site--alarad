import { db } from '@/lib/db';
import { bad, json, readJson } from '@/lib/http';
import { normalizePhone } from '@/lib/format';

export async function POST(req: Request) {
  const raw = String((await readJson<{ contact?: string }>(req)).contact ?? '').trim().toLowerCase();
  const phone = normalizePhone(raw);
  const contact = /^09\d{9}$/.test(phone) ? phone : raw;
  if (!/^09\d{9}$/.test(contact) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return bad('ایمیل یا شمارهٔ همراه معتبر وارد کنید.', 422);
  await db.newsletterSubscriber.upsert({ where: { contact }, update: { isActive: true }, create: { contact } });
  return json({ ok: true });
}
