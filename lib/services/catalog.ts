import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { CategoryNode, ColorOption, Product, ProductImage, Review, SizeOption } from '@/lib/types';

/* ───────────────────────────── categories ───────────────────────────── */

interface FlatCategory {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string | null;
  imageBlur: string | null;
  accent: string | null;
  sortOrder: number;
  ownCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
}

/** every active category + direct product counts (memoised per request) */
const loadCategories = cache(async () => {
  const rows = await db.category.findMany({
    where: { isActive: true },
    include: { image: true, _count: { select: { products: { where: { status: 'active' } } } } },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  const flat: FlatCategory[] = rows.map((c) => ({
    id: Number(c.id),
    parentId: c.parentId === null ? null : Number(c.parentId),
    slug: c.slug,
    name: c.name,
    tagline: c.tagline ?? '',
    description: c.description ?? '',
    image: c.image?.url ?? null,
    imageBlur: c.image?.blurDataUrl ?? null,
    accent: c.accent,
    sortOrder: c.sortOrder,
    ownCount: c._count.products,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
  }));
  const byId = new Map(flat.map((c) => [c.id, c]));
  return { flat, byId };
});

/** nested tree of active categories (an inactive parent hides its subtree) */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const { flat, byId } = await loadCategories();
  const build = (parentId: number | null): CategoryNode[] =>
    flat
      .filter((c) => c.parentId === parentId)
      .map((c) => {
        const children = build(c.id);
        return {
          id: c.id,
          parentId: c.parentId,
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          image: c.image,
          imageBlur: c.imageBlur,
          accent: c.accent,
          productCount: c.ownCount + children.reduce((s, ch) => s + ch.productCount, 0),
          children,
        };
      });
  void byId;
  return build(null);
});

/** category by slug + ancestors (root → self) + ids of self and all descendants */
export async function findCategory(slug: string) {
  const { flat, byId } = await loadCategories();
  const self = flat.find((c) => c.slug === slug);
  if (!self) return null;
  // an ancestor may be inactive → treat as not found
  const path: FlatCategory[] = [];
  let cur: FlatCategory | undefined = self;
  while (cur) {
    path.unshift(cur);
    if (cur.parentId === null) break;
    cur = byId.get(cur.parentId);
    if (!cur) return null;
  }
  const ids: number[] = [];
  const walk = (id: number) => {
    ids.push(id);
    flat.filter((c) => c.parentId === id).forEach((c) => walk(c.id));
  };
  walk(self.id);
  const tree = await getCategoryTree();
  const findNode = (nodes: CategoryNode[]): CategoryNode | null => {
    for (const nd of nodes) {
      if (nd.id === self.id) return nd;
      const hit = findNode(nd.children);
      if (hit) return hit;
    }
    return null;
  };
  return { category: self, node: findNode(tree)!, path, descendantIds: ids };
}

/** root → leaf path for a category id */
async function pathOf(categoryId: number) {
  const { byId } = await loadCategories();
  const out: { slug: string; name: string }[] = [];
  let cur = byId.get(categoryId);
  while (cur) {
    out.unshift({ slug: cur.slug, name: cur.name });
    cur = cur.parentId === null ? undefined : byId.get(cur.parentId);
  }
  return out;
}

/* ───────────────────────────── products ───────────────────────────── */

const productInclude = {
  images: { include: { media: true, color: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  variants: { where: { isActive: true }, include: { color: true, size: true } },
  tags: { include: { tag: true } },
  category: true,
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

async function toProduct(p: ProductRow): Promise<Product> {
  const palette: Record<string, ColorOption> = {};
  const sizeMeta: Record<string, SizeOption> = {};
  const colorOrder = new Map<string, number>();
  const sizeOrder = new Map<string, number>();
  for (const v of p.variants) {
    if (v.color) {
      palette[v.color.key] = { key: v.color.key, name: v.color.name, hex: v.color.hex, swatch: v.color.swatch ?? undefined };
      colorOrder.set(v.color.key, v.color.sortOrder);
    }
    if (v.size) {
      sizeMeta[v.size.key] = { key: v.size.key, label: v.size.label, note: v.size.note ?? undefined };
      sizeOrder.set(v.size.key, v.size.sortOrder);
    }
  }
  // colour order follows the gallery (first photo's colour first), then palette order
  const galleryColorOrder: string[] = [];
  for (const im of p.images) if (im.color && !galleryColorOrder.includes(im.color.key)) galleryColorOrder.push(im.color.key);
  const colors = [...colorOrder.keys()].sort((a, b) => {
    const ga = galleryColorOrder.indexOf(a);
    const gb = galleryColorOrder.indexOf(b);
    if (ga !== -1 || gb !== -1) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
    return (colorOrder.get(a) ?? 0) - (colorOrder.get(b) ?? 0);
  });
  const sizes = [...sizeOrder.keys()].sort((a, b) => (sizeOrder.get(a) ?? 0) - (sizeOrder.get(b) ?? 0));
  // variants without a colour / size dimension use the '' key
  if (p.variants.some((v) => !v.color)) {
    colors.push('');
    palette[''] = { key: '', name: 'تک‌رنگ', hex: '#E3D5C3' };
  }
  if (p.variants.some((v) => !v.size)) {
    sizes.push('');
    sizeMeta[''] = { key: '', label: 'یک اندازه' };
  }

  const images: ProductImage[] = p.images.map((im) => ({
    src: im.media.url,
    blur: im.media.blurDataUrl ?? '',
    color: im.color?.key ?? null,
    alt: im.media.alt ?? p.name,
  }));

  const path = await pathOf(Number(p.categoryId));
  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle ?? '',
    description: (p.description ?? '').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
    category: p.category.slug,
    categoryName: p.category.name,
    categoryPath: path.length ? path : [{ slug: p.category.slug, name: p.category.name }],
    audience: p.audience,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    colors,
    sizes,
    variants: p.variants.map((v) => ({
      id: String(v.id),
      sku: v.sku,
      color: v.color?.key ?? '',
      size: v.size?.key ?? '',
      stock: v.stock,
      price: v.price ?? undefined,
    })),
    images,
    palette,
    sizeMeta,
    details: { material: p.material ?? '', care: p.care ?? '', origin: p.origin ?? '' },
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
    tags: p.tags.map((t) => t.tag.slug),
    createdAt: (p.publishedAt ?? p.createdAt).toISOString(),
    popularity: p.popularity + p.salesCount,
    highlights: Array.isArray(p.highlights) ? (p.highlights as unknown[]).map(String) : [],
  };
}

const ACTIVE: Prisma.ProductWhereInput = { status: 'active', category: { isActive: true } };

/** every active product (catalog is small — filtering/sorting happens in lib/shop.ts) */
export const getActiveProducts = cache(async (): Promise<Product[]> => {
  const rows = await db.product.findMany({ where: ACTIVE, include: productInclude, orderBy: { id: 'asc' } });
  return Promise.all(rows.map(toProduct));
});

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await db.product.findFirst({ where: { ...ACTIVE, slug }, include: productInclude });
  return row ? toProduct(row) : null;
}

export async function getProductMeta(slug: string) {
  return db.product.findFirst({
    where: { ...ACTIVE, slug },
    select: { name: true, subtitle: true, metaTitle: true, metaDescription: true, images: { take: 1, orderBy: { sortOrder: 'asc' }, include: { media: true } } },
  });
}

export async function productsInCategories(ids: number[]) {
  const all = await getActiveProducts();
  const set = new Set(ids);
  const { flat } = await loadCategories();
  const idBySlug = new Map(flat.map((c) => [c.slug, c.id]));
  return all.filter((p) => set.has(idBySlug.get(p.category) ?? -1));
}

export async function newArrivals(limit = 8) {
  return [...(await getActiveProducts())].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function bestSellers(limit = 8) {
  const all = await getActiveProducts();
  const tagged = all.filter((p) => p.tags.includes('bestseller'));
  return [...(tagged.length >= limit ? tagged : all)].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export async function recommendations(limit = 4, exclude?: string) {
  const all = (await getActiveProducts()).filter((p) => p.slug !== exclude);
  const picks = all.filter((p) => p.tags.includes('recommended'));
  return [...(picks.length >= limit ? picks : all)].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export async function relatedProducts(product: Product, limit = 4) {
  const root = product.categoryPath[0]?.slug;
  return (await getActiveProducts())
    .filter((p) => p.slug !== product.slug)
    .map((p) => ({
      p,
      score:
        (p.category === product.category ? 4 : 0) +
        (p.categoryPath[0]?.slug === root ? 2 : 0) +
        (p.audience === product.audience ? 1 : 0) +
        p.colors.filter((c) => product.colors.includes(c)).length * 0.4 +
        p.rating / 10,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export async function priceBounds() {
  const agg = await db.product.aggregate({ where: ACTIVE, _min: { price: true }, _max: { price: true } });
  const min = Math.floor((agg._min.price ?? 0) / 10_000) * 10_000;
  const max = Math.ceil((agg._max.price ?? 1_000_000) / 10_000) * 10_000;
  return { min, max: Math.max(max, min + 10_000) };
}

/** colours + sizes used by at least one active product (for filters) */
export const getFilterOptions = cache(async () => {
  const [colors, sizes] = await Promise.all([
    db.color.findMany({ where: { variants: { some: { isActive: true, product: ACTIVE } } }, orderBy: { sortOrder: 'asc' } }),
    db.size.findMany({ where: { variants: { some: { isActive: true, product: ACTIVE } } }, orderBy: [{ sizeGroup: 'asc' }, { sortOrder: 'asc' }] }),
  ]);
  const sizeMap = new Map<string, { key: string; label: string }>();
  for (const s of sizes) if (!sizeMap.has(s.key)) sizeMap.set(s.key, { key: s.key, label: s.label });
  return {
    colors: colors.map((c) => ({ key: c.key, name: c.name, hex: c.hex, swatch: c.swatch ?? undefined })) as ColorOption[],
    sizes: [...sizeMap.values()],
  };
});

export async function getTags() {
  return db.tag.findMany({ orderBy: { id: 'asc' } });
}

export async function approvedReviews(productId: string, limit = 12): Promise<Review[]> {
  const rows = await db.review.findMany({
    where: { productId: BigInt(productId), status: 'approved' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: String(r.id),
    productSlug: '',
    author: r.authorName,
    rating: r.rating,
    date: r.createdAt.toISOString(),
    body: r.body,
    verified: r.isVerifiedBuyer,
    reply: r.adminReply ?? undefined,
  }));
}

/** size guide for /help — grouped size sets */
export async function sizeGuide() {
  const rows = await db.size.findMany({ orderBy: [{ sizeGroup: 'asc' }, { sortOrder: 'asc' }] });
  const groups: Record<string, SizeOption[]> = {};
  for (const r of rows) (groups[r.sizeGroup] ??= []).push({ key: r.key, label: r.label, note: r.note ?? undefined });
  return groups;
}
