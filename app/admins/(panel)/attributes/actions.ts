'use server';

import { db, toId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { int, optStr, slugify, str } from '@/lib/admin/form-data';

const faN = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

const keyOf = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/* ── colours ── */
export async function saveColor(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  const key = keyOf(str(fd, 'key'));
  const name = str(fd, 'name');
  const hex = str(fd, 'hex').toUpperCase();
  const errors: Record<string, string> = {};
  if (!key) errors.key = 'کلید لاتین (مثل cream) لازم است.';
  if (name.length < 1) errors.name = 'نام رنگ را وارد کنید.';
  if (!/^#[0-9A-F]{6}([0-9A-F]{2})?$/.test(hex)) errors.hex = 'کد رنگ باید به شکل ‎#RRGGBB باشد.';
  const clash = key ? await db.color.findUnique({ where: { key } }) : null;
  if (clash && clash.id !== id) errors.key = 'این کلید قبلاً استفاده شده است.';
  if (Object.keys(errors).length) return fail('اطلاعات رنگ را بررسی کنید.', errors);
  const data = { key, name, hex, swatch: optStr(fd, 'swatch'), sortOrder: int(fd, 'sortOrder') };
  if (id) await db.color.update({ where: { id }, data });
  else await db.color.create({ data });
  return ok(id ? `رنگ «${name}» ذخیره شد.` : `رنگ «${name}» اضافه شد.`);
}

export async function deleteColor(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  if (!id) return fail('شناسه نامعتبر است.');
  const c = await db.color.findUnique({ where: { id }, include: { _count: { select: { variants: true } } } });
  if (!c) return fail('رنگ پیدا نشد.');
  if (c._count.variants)
    return fail(`رنگ «${c.name}» در ${faN(c._count.variants)} تنوع محصول استفاده شده و قابل حذف نیست. ابتدا آن تنوع‌ها را تغییر دهید.`);
  await db.color.delete({ where: { id } });
  return ok('رنگ حذف شد.');
}

/* ── sizes ── */
export async function saveSize(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  const sizeGroup = keyOf(str(fd, 'sizeGroup'));
  const key = keyOf(str(fd, 'key'));
  const label = str(fd, 'label');
  const errors: Record<string, string> = {};
  if (!sizeGroup) errors.sizeGroup = 'گروه سایز (لاتین) لازم است.';
  if (!key) errors.key = 'کلید سایز (لاتین) لازم است.';
  if (!label) errors.label = 'برچسب نمایشی را وارد کنید.';
  if (sizeGroup && key) {
    const clash = await db.size.findUnique({ where: { sizeGroup_key: { sizeGroup, key } } });
    if (clash && clash.id !== id) errors.key = 'این کلید در این گروه وجود دارد.';
  }
  if (Object.keys(errors).length) return fail('اطلاعات سایز را بررسی کنید.', errors);
  const data = { sizeGroup, key, label, note: optStr(fd, 'note'), sortOrder: int(fd, 'sortOrder') };
  if (id) await db.size.update({ where: { id }, data });
  else await db.size.create({ data });
  return ok(id ? 'سایز ذخیره شد.' : 'سایز اضافه شد.');
}

export async function deleteSize(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  if (!id) return fail('شناسه نامعتبر است.');
  const s = await db.size.findUnique({ where: { id }, include: { _count: { select: { variants: true } } } });
  if (!s) return fail('سایز پیدا نشد.');
  if (s._count.variants) return fail(`سایز «${s.label}» در ${faN(s._count.variants)} تنوع محصول استفاده شده و قابل حذف نیست.`);
  await db.size.delete({ where: { id } });
  return ok('سایز حذف شد.');
}

/* ── tags ── */
export async function saveTag(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  const name = str(fd, 'name');
  const slug = slugify(str(fd, 'slug') || name);
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'نام برچسب را وارد کنید.';
  if (!slug) errors.slug = 'نامک معتبر نیست.';
  const clash = slug ? await db.tag.findUnique({ where: { slug } }) : null;
  if (clash && clash.id !== id) errors.slug = 'این نامک وجود دارد.';
  if (Object.keys(errors).length) return fail('اطلاعات برچسب را بررسی کنید.', errors);
  if (id) await db.tag.update({ where: { id }, data: { name, slug } });
  else await db.tag.create({ data: { name, slug } });
  return ok(id ? 'برچسب ذخیره شد.' : 'برچسب اضافه شد.');
}

export async function deleteTag(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  if (!id) return fail('شناسه نامعتبر است.');
  await db.tag.delete({ where: { id } }).catch(() => null);
  return ok('برچسب حذف شد (از محصولات هم برداشته شد).');
}
