import { db } from '@/lib/db';
import { json } from '@/lib/http';

export async function GET() {
  const rows = await db.province.findMany({ orderBy: { name: 'asc' } });
  return json(
    { ok: true, provinces: rows.map((p) => ({ id: Number(p.id), name: p.name })) },
  );
}
