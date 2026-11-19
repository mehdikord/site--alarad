import { db, toId } from '@/lib/db';
import { bad, json } from '@/lib/http';

export async function GET(req: Request) {
  const provinceId = toId(new URL(req.url).searchParams.get('province'));
  if (!provinceId) return bad('استان نامعتبر است.', 422);
  const rows = await db.city.findMany({ where: { provinceId }, orderBy: { name: 'asc' } });
  return json({ ok: true, cities: rows.map((c) => ({ id: Number(c.id), name: c.name })) });
}
