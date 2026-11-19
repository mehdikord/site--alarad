import 'server-only';
import { db } from '@/lib/db';
import { categoryTreeOptions } from '@/lib/admin/catalog/categories';
import type { EditorOptions, ProductPayload } from '@/lib/admin/catalog/product-types';

export async function editorOptions(): Promise<EditorOptions> {
  const [cats, colors, sizes, tags] = await Promise.all([
    categoryTreeOptions(),
    db.color.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    db.size.findMany({ orderBy: [{ sizeGroup: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }] }),
    db.tag.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return {
    categories: cats.map((c) => ({ id: c.id, name: c.name, depth: c.depth, isActive: c.isActive })),
    colors: colors.map((c) => ({ id: Number(c.id), key: c.key, name: c.name, hex: c.hex, swatch: c.swatch })),
    sizes: sizes.map((s) => ({ id: Number(s.id), sizeGroup: s.sizeGroup, key: s.key, label: s.label })),
    tags: tags.map((t) => ({ id: Number(t.id), name: t.name, slug: t.slug })),
  };
}

/** product → editor payload (+ ids of variants that appear in orders) */
export async function productForEditor(id: bigint) {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      tags: true,
      variants: { orderBy: { id: 'asc' }, include: { _count: { select: { orderItems: true } } } },
      images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { media: true } },
      _count: { select: { orderItems: true } },
    },
  });
  if (!p) return null;
  const payload: ProductPayload = {
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    subtitle: p.subtitle ?? '',
    description: p.description ?? '',
    categoryId: Number(p.categoryId),
    audience: p.audience,
    status: p.status,
    isFeatured: p.isFeatured,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    material: p.material ?? '',
    care: p.care ?? '',
    origin: p.origin ?? '',
    highlights: Array.isArray(p.highlights) ? (p.highlights as unknown[]).map(String) : [],
    tagIds: p.tags.map((t) => Number(t.tagId)),
    metaTitle: p.metaTitle ?? '',
    metaDescription: p.metaDescription ?? '',
    variants: p.variants.map((v) => ({
      id: Number(v.id),
      colorId: v.colorId === null ? null : Number(v.colorId),
      sizeId: v.sizeId === null ? null : Number(v.sizeId),
      sku: v.sku,
      stock: v.stock,
      price: v.price,
      isActive: v.isActive,
    })),
    images: p.images.map((im) => ({ mediaId: Number(im.mediaId), colorId: im.colorId === null ? null : Number(im.colorId), url: im.media.url })),
  };
  return {
    payload,
    orderedVariantIds: p.variants.filter((v) => v._count.orderItems > 0).map((v) => Number(v.id)),
    orderCount: p._count.orderItems,
    stats: { rating: Number(p.rating), reviewCount: p.reviewCount, salesCount: p.salesCount, createdAt: p.createdAt.toISOString() },
  };
}
