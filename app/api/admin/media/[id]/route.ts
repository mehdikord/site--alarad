import { NextResponse } from 'next/server';
import { db, toId } from '@/lib/db';
import { getAdmin } from '@/lib/auth/admin';
import { deleteMedia, toMediaDTO } from '@/lib/media';

const unauthorized = () => NextResponse.json({ ok: false, message: 'دسترسی غیرمجاز' }, { status: 401 });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized();
  const id = toId((await params).id);
  if (!id) return NextResponse.json({ ok: false, message: 'شناسه نامعتبر است.' }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as { alt?: unknown; title?: unknown };
  const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 255) || null : undefined);
  try {
    const m = await db.media.update({
      where: { id },
      data: { alt: clean(body.alt), title: clean(body.title) },
      include: { _count: { select: { productImages: true, categories: true } } },
    });
    return NextResponse.json({ ok: true, item: toMediaDTO(m), message: 'اطلاعات فایل ذخیره شد.' });
  } catch {
    return NextResponse.json({ ok: false, message: 'فایل پیدا نشد.' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized();
  const id = toId((await params).id);
  if (!id) return NextResponse.json({ ok: false, message: 'شناسه نامعتبر است.' }, { status: 400 });
  const exists = await db.media.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ ok: false, message: 'فایل پیدا نشد.' }, { status: 404 });
  await deleteMedia(id);
  return NextResponse.json({ ok: true, message: 'فایل حذف شد.' });
}
