import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAdmin } from '@/lib/auth/admin';
import { saveUpload, toMediaDTO } from '@/lib/media';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 401 });

/** GET /api/admin/media?q=&page=&take= */
export async function GET(req: Request) {
  if (!(await getAdmin())) return unauthorized();
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get('take')) || 40));
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const where: Prisma.MediaWhereInput = q
    ? { OR: [{ originalName: { contains: q } }, { alt: { contains: q } }, { title: { contains: q } }, { fileName: { contains: q } }] }
    : {};
  const [rows, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * take,
      take,
      include: { _count: { select: { productImages: true, categories: true } } },
    }),
    db.media.count({ where }),
  ]);
  return NextResponse.json({ ok: true, items: rows.map(toMediaDTO), total, page, pages: Math.max(1, Math.ceil(total / take)) });
}

/** POST multipart: files[] (or file) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, message: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  const files = [...form.getAll('files'), ...form.getAll('file')].filter((f): f is File => typeof f === 'object' && 'arrayBuffer' in f);
  if (!files.length) return NextResponse.json({ ok: false, message: 'فایلی انتخاب نشده است.' }, { status: 400 });

  const items = [];
  const errors: { name: string; message: string }[] = [];
  for (const file of files.slice(0, 30)) {
    try {
      const m = await saveUpload(file, admin.id);
      items.push(toMediaDTO({ ...m, _count: { productImages: 0, categories: 0 } }));
    } catch (e) {
      errors.push({ name: file.name, message: e instanceof Error ? e.message : 'خطا در بارگذاری' });
    }
  }
  return NextResponse.json(
    { ok: items.length > 0, items, errors, message: items.length ? `${items.length} فایل بارگذاری شد.` : errors[0]?.message ?? 'بارگذاری ناموفق بود.' },
    { status: items.length ? 200 : 422 },
  );
}
