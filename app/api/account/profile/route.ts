import { db } from '@/lib/db';
import { bad, json, readJson } from '@/lib/http';
import { getUser, publicUser } from '@/lib/auth/user';

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  const body = await readJson<{ name?: string; email?: string }>(req);
  const name = String(body.name ?? '').trim().slice(0, 255);
  const email = String(body.email ?? '').trim().slice(0, 255);
  if (name.length < 2) return bad('نام را کامل وارد کنید.', 422, { errors: { name: 'نام را کامل وارد کنید.' } });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('ایمیل معتبر نیست.', 422, { errors: { email: 'ایمیل معتبر نیست.' } });
  const updated = await db.user.update({ where: { id: user.id }, data: { name, email: email || null } });
  return json({ ok: true, user: publicUser(updated), message: 'اطلاعات حساب ذخیره شد.' });
}
