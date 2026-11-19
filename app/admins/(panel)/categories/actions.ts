'use server';

import { revalidatePath } from 'next/cache';
import { db, toId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { bool, id, int, optStr, slugify, str } from '@/lib/admin/form-data';
import { categoryTreeOptions, descendantsOf } from '@/lib/admin/catalog/categories';

const faN = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

async function uniqueSlug(base: string, exceptId: bigint | null) {
  const root = base || 'category';
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const hit = await db.category.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
  }
  return `${root}-${Date.now()}`;
}

export async function saveCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const categoryId = id(fd, 'id');
  const name = str(fd, 'name');
  const rawSlug = slugify(str(fd, 'slug'));
  const parentId = id(fd, 'parentId');
  const imageId = id(fd, 'imageId');

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'نام دسته را وارد کنید.';
  if (str(fd, 'slug') && !rawSlug) errors.slug = 'نامک فقط می‌تواند شامل حروف، عدد و خط تیره باشد.';
  if (rawSlug) {
    const clash = await db.category.findUnique({ where: { slug: rawSlug }, select: { id: true } });
    if (clash && clash.id !== categoryId) errors.slug = 'این نامک قبلاً برای دستهٔ دیگری استفاده شده است.';
  }
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId }, select: { id: true } });
    if (!parent) errors.parentId = 'دستهٔ والد پیدا نشد.';
    if (categoryId) {
      const options = await categoryTreeOptions();
      if (descendantsOf(options, Number(categoryId)).includes(Number(parentId)))
        errors.parentId = 'یک دسته نمی‌تواند زیرمجموعهٔ خودش یا فرزندانش باشد.';
    }
  }
  if (imageId && !(await db.media.findUnique({ where: { id: imageId }, select: { id: true } }))) errors.imageId = 'تصویر انتخاب‌شده پیدا نشد.';
  if (Object.keys(errors).length) return fail('لطفاً خطاهای فرم را برطرف کنید.', errors);

  const slug = rawSlug || (await uniqueSlug(slugify(name), categoryId));
  const data = {
    name,
    slug,
    parentId: parentId ?? null,
    imageId: imageId ?? null,
    tagline: optStr(fd, 'tagline'),
    description: optStr(fd, 'description'),
    accent: optStr(fd, 'accent'),
    sortOrder: int(fd, 'sortOrder'),
    isActive: bool(fd, 'isActive'),
    metaTitle: optStr(fd, 'metaTitle'),
    metaDescription: optStr(fd, 'metaDescription'),
  };

  if (categoryId) {
    const exists = await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!exists) return fail('دسته پیدا نشد.');
    await db.category.update({ where: { id: categoryId }, data });
  } else {
    await db.category.create({ data });
  }
  revalidatePath('/admins/categories');
  return ok(categoryId ? 'دسته‌بندی به‌روزرسانی شد.' : 'دسته‌بندی ساخته شد.', { redirect: '/admins/categories' });
}

export async function deleteCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const categoryId = toId(str(fd, 'id'));
  if (!categoryId) return fail('شناسه نامعتبر است.');
  const cat = await db.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!cat) return fail('دسته پیدا نشد.');
  if (cat._count.children > 0)
    return fail(`«${cat.name}» ${faN(cat._count.children)} زیردسته دارد؛ ابتدا زیردسته‌ها را حذف یا به دستهٔ دیگری منتقل کنید.`);
  if (cat._count.products > 0)
    return fail(`«${cat.name}» ${faN(cat._count.products)} محصول دارد؛ ابتدا محصولات را به دستهٔ دیگری منتقل کنید.`);
  await db.category.delete({ where: { id: categoryId } });
  revalidatePath('/admins/categories');
  return ok('دسته‌بندی حذف شد.', { redirect: '/admins/categories' });
}

export async function toggleCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const categoryId = toId(str(fd, 'id'));
  if (!categoryId) return fail('شناسه نامعتبر است.');
  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat) return fail('دسته پیدا نشد.');
  await db.category.update({ where: { id: categoryId }, data: { isActive: !cat.isActive } });
  return ok(cat.isActive ? 'دسته غیرفعال شد (زیردسته‌ها هم در فروشگاه پنهان می‌شوند).' : 'دسته فعال شد.');
}
