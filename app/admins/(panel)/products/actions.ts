'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { db, toId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { slugify, str } from '@/lib/admin/form-data';
import type { ProductPayload, SaveProductResult } from '@/lib/admin/catalog/product-types';

const faN = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

const uint = z.coerce.number().int().min(0).max(4_294_967_295);
const idNum = z.coerce.number().int().positive();

const schema = z.object({
  id: idNum.nullish(),
  name: z.string().trim().min(2, 'نام محصول را وارد کنید.').max(255),
  slug: z.string().trim().max(191),
  subtitle: z.string().trim().max(255),
  description: z.string().max(60_000),
  categoryId: idNum.nullable(),
  audience: z.enum(['women', 'men', 'kids', 'unisex']),
  status: z.enum(['draft', 'active', 'archived']),
  isFeatured: z.boolean(),
  price: uint,
  compareAtPrice: uint.nullable(),
  material: z.string().trim().max(255),
  care: z.string().trim().max(255),
  origin: z.string().trim().max(255),
  highlights: z.array(z.string().trim().max(120)).max(20),
  tagIds: z.array(idNum).max(50),
  metaTitle: z.string().trim().max(255),
  metaDescription: z.string().trim().max(500),
  variants: z
    .array(
      z.object({
        id: idNum.nullish(),
        colorId: idNum.nullable(),
        sizeId: idNum.nullable(),
        sku: z.string().trim().max(64),
        stock: uint,
        price: uint.nullable(),
        isActive: z.boolean(),
      }),
    )
    .max(500),
  images: z.array(z.object({ mediaId: idNum, colorId: idNum.nullable() })).max(200),
});

const big = (n: number) => BigInt(n);

export async function saveProduct(input: ProductPayload): Promise<SaveProductResult> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join('.')] ??= issue.message;
    return { ok: false, message: 'اطلاعات محصول معتبر نیست؛ خطاهای مشخص‌شده را برطرف کنید.', errors };
  }
  const d = parsed.data;
  const productId = d.id ? big(d.id) : null;
  const errors: Record<string, string> = {};

  // product + category
  const existing = productId ? await db.product.findUnique({ where: { id: productId } }) : null;
  if (productId && !existing) return { ok: false, message: 'محصول پیدا نشد.' };
  if (!d.categoryId) errors.categoryId = 'دسته‌بندی محصول را انتخاب کنید.';
  else if (!(await db.category.findUnique({ where: { id: big(d.categoryId) }, select: { id: true } }))) errors.categoryId = 'دسته‌بندی پیدا نشد.';
  if (d.price <= 0) errors.price = 'قیمت باید بیشتر از صفر باشد.';
  if (d.compareAtPrice !== null && d.compareAtPrice > 0 && d.compareAtPrice <= d.price)
    errors.compareAtPrice = 'قیمت قبل از تخفیف باید بیشتر از قیمت فروش باشد.';

  // slug
  let slug = slugify(d.slug || d.name);
  if (!slug) errors.slug = 'نامک معتبر نیست.';
  else {
    const clash = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== productId) {
      if (d.slug) errors.slug = 'این نامک برای محصول دیگری استفاده شده است.';
      else slug = `${slug}-${Date.now().toString(36)}`;
    }
  }

  // variants
  if (d.variants.length === 0) errors.variants = 'حداقل یک تنوع (رنگ/سایز) لازم است.';
  const combos = new Set<string>();
  const skus = new Map<string, number>();
  d.variants.forEach((v, i) => {
    const combo = `${v.colorId ?? 0}:${v.sizeId ?? 0}`;
    if (combos.has(combo)) errors[`variants.${i}.sku`] = 'این ترکیب رنگ و سایز تکراری است.';
    combos.add(combo);
    const sku = v.sku.toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(sku)) errors[`variants.${i}.sku`] = 'SKU فقط حروف لاتین، عدد، نقطه و خط تیره (حداقل ۲ نویسه).';
    else if (skus.has(sku)) errors[`variants.${i}.sku`] = `SKU با ردیف ${faN(skus.get(sku)! + 1)} تکراری است.`;
    skus.set(sku, i);
  });
  const ownVariantIds = existing ? (await db.productVariant.findMany({ where: { productId: existing.id }, select: { id: true } })).map((v) => v.id) : [];
  if (skus.size) {
    const taken = await db.productVariant.findMany({
      where: { sku: { in: [...skus.keys()] }, ...(ownVariantIds.length ? { id: { notIn: ownVariantIds } } : {}) },
      select: { sku: true, product: { select: { name: true } } },
    });
    for (const t of taken) errors[`variants.${skus.get(t.sku.toUpperCase())}.sku`] = `این SKU متعلق به «${t.product.name}» است.`;
  }
  // referenced colours/sizes/tags/media exist
  const colorIds = [...new Set([...d.variants.map((v) => v.colorId), ...d.images.map((i) => i.colorId)].filter((x): x is number => !!x))];
  const sizeIds = [...new Set(d.variants.map((v) => v.sizeId).filter((x): x is number => !!x))];
  const mediaIds = [...new Set(d.images.map((i) => i.mediaId))];
  const [cCount, sCount, mCount, tCount] = await Promise.all([
    db.color.count({ where: { id: { in: colorIds.map(big) } } }),
    db.size.count({ where: { id: { in: sizeIds.map(big) } } }),
    db.media.count({ where: { id: { in: mediaIds.map(big) } } }),
    db.tag.count({ where: { id: { in: d.tagIds.map(big) } } }),
  ]);
  if (cCount !== colorIds.length || sCount !== sizeIds.length) errors.variants = 'برخی رنگ‌ها یا سایزها دیگر وجود ندارند؛ صفحه را تازه کنید.';
  if (mCount !== mediaIds.length) errors.images = 'برخی تصاویر از رسانه حذف شده‌اند؛ دوباره انتخاب کنید.';
  if (tCount !== new Set(d.tagIds).size) errors.tagIds = 'برخی برچسب‌ها وجود ندارند.';

  if (Object.keys(errors).length) return { ok: false, message: 'لطفاً خطاهای فرم را برطرف کنید.', errors };

  const data = {
    name: d.name,
    slug,
    subtitle: d.subtitle || null,
    description: d.description.trim() || null,
    categoryId: big(d.categoryId!),
    audience: d.audience,
    status: d.status,
    isFeatured: d.isFeatured,
    price: d.price,
    compareAtPrice: d.compareAtPrice || null,
    material: d.material || null,
    care: d.care || null,
    origin: d.origin || null,
    highlights: d.highlights.filter(Boolean),
    metaTitle: d.metaTitle || null,
    metaDescription: d.metaDescription || null,
  };

  try {
    const savedId = await db.$transaction(
      async (tx) => {
        const publishedAt = d.status === 'active' && !existing?.publishedAt ? new Date() : undefined;
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data: { ...data, ...(publishedAt ? { publishedAt } : {}) } })
          : await tx.product.create({ data: { ...data, publishedAt: publishedAt ?? null } });

        // tags
        await tx.productTag.deleteMany({ where: { productId: product.id, tagId: { notIn: d.tagIds.map(big) } } });
        for (const tagId of d.tagIds) {
          await tx.productTag.upsert({
            where: { productId_tagId: { productId: product.id, tagId: big(tagId) } },
            update: {},
            create: { productId: product.id, tagId: big(tagId) },
          });
        }

        // variants
        const current = await tx.productVariant.findMany({
          where: { productId: product.id },
          include: { _count: { select: { orderItems: true } } },
        });
        const comboOf = (c: bigint | number | null, s: bigint | number | null) => `${c ?? 0}:${s ?? 0}`;
        const matched = new Map<number, (typeof current)[number]>(); // payload index → row
        d.variants.forEach((v, i) => {
          const byId = v.id ? current.find((r) => r.id === big(v.id!)) : undefined;
          const row = byId ?? current.find((r) => comboOf(r.colorId, r.sizeId) === comboOf(v.colorId, v.sizeId));
          if (row && ![...matched.values()].includes(row)) matched.set(i, row);
        });
        const keep = new Set([...matched.values()].map((r) => r.id));
        // remove / deactivate dropped variants
        for (const r of current.filter((r) => !keep.has(r.id))) {
          if (r._count.orderItems > 0) await tx.productVariant.update({ where: { id: r.id }, data: { isActive: false } });
          else await tx.productVariant.delete({ where: { id: r.id } });
        }
        // free SKUs that are about to move between rows
        for (const [i, r] of matched) {
          if (r.sku !== d.variants[i].sku.toUpperCase()) await tx.productVariant.update({ where: { id: r.id }, data: { sku: `__TMP_${r.id}` } });
        }
        for (const [i, v] of d.variants.entries()) {
          const vData = {
            colorId: v.colorId ? big(v.colorId) : null,
            sizeId: v.sizeId ? big(v.sizeId) : null,
            sku: v.sku.toUpperCase(),
            stock: v.stock,
            price: v.price || null,
            isActive: v.isActive,
          };
          const row = matched.get(i);
          if (row) await tx.productVariant.update({ where: { id: row.id }, data: vData });
          else await tx.productVariant.create({ data: { ...vData, productId: product.id } });
        }

        // gallery
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        if (d.images.length) {
          await tx.productImage.createMany({
            data: d.images.map((im, i) => ({
              productId: product.id,
              mediaId: big(im.mediaId),
              colorId: im.colorId ? big(im.colorId) : null,
              sortOrder: i,
            })),
          });
        }
        return product.id;
      },
      { timeout: 20_000 },
    );
    revalidatePath('/admins/products');
    return { ok: true, message: existing ? 'محصول ذخیره شد.' : 'محصول ساخته شد.', id: Number(savedId) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return { ok: false, message: 'یک مقدار یکتا (نامک یا SKU) تکراری است.', errors: { variants: 'SKU یا ترکیب تکراری' } };
    console.error('saveProduct', e);
    return { ok: false, message: 'ذخیرهٔ محصول با خطا مواجه شد.' };
  }
}

export async function deleteProduct(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  if (!id) return fail('شناسه نامعتبر است.');
  const p = await db.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!p) return fail('محصول پیدا نشد.');
  if (p._count.orderItems > 0)
    return fail(`«${p.name}» در ${faN(p._count.orderItems)} سفارش ثبت شده و قابل حذف نیست؛ به‌جای حذف، وضعیت آن را «بایگانی» کنید.`);
  await db.product.delete({ where: { id } });
  revalidatePath('/admins/products');
  return ok('محصول حذف شد.', { redirect: '/admins/products' });
}

export async function setProductStatus(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = toId(str(fd, 'id'));
  const status = str(fd, 'status');
  if (!id || !['draft', 'active', 'archived'].includes(status)) return fail('درخواست نامعتبر است.');
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return fail('محصول پیدا نشد.');
  await db.product.update({
    where: { id },
    data: { status: status as 'draft' | 'active' | 'archived', ...(status === 'active' && !p.publishedAt ? { publishedAt: new Date() } : {}) },
  });
  return ok('وضعیت محصول تغییر کرد.');
}
