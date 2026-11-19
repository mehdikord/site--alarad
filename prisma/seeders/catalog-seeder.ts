import fs from 'node:fs';
import path from 'node:path';
import { prisma, log } from './client';
import { COLORS, SIZE_GROUPS, TAGS, SUBCATEGORIES } from './data/taxonomy';
import { CATEGORIES } from './data/categories';
import { PRODUCTS, reviewsFor } from './data/products';

type ManifestEntry = { w: number; h: number; blur: string };
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const manifest = JSON.parse(
  fs.readFileSync(path.join(PUBLIC_DIR, 'images', 'manifest.json'), 'utf8'),
) as Record<string, ManifestEntry>;

/** Registers a bundled /public/images asset in the media library (idempotent). */
async function mediaFor(key: string, alt?: string) {
  const entry = manifest[key];
  if (!entry) return null;
  const rel = `images/${key}.webp`;
  const existing = await prisma.media.findFirst({ where: { disk: 'public', path: rel } });
  if (existing) return existing;
  const size = fs.existsSync(path.join(PUBLIC_DIR, rel)) ? fs.statSync(path.join(PUBLIC_DIR, rel)).size : 0;
  return prisma.media.create({
    data: {
      disk: 'public',
      path: rel,
      url: `/${rel}`,
      fileName: `${key}.webp`,
      originalName: `${key}.webp`,
      mimeType: 'image/webp',
      size,
      width: entry.w,
      height: entry.h,
      blurDataUrl: entry.blur,
      alt: alt ?? null,
    },
  });
}

/** unique 2-letter colour codes (the original `slice(0,2)` collided: blush/black → BL) */
const COLOR_CODE: Record<string, string> = {
  cream: 'CR', oat: 'OT', sage: 'SG', blush: 'BS', rose: 'RS', dove: 'DV', charcoal: 'CH', black: 'BK', navy: 'NV',
};

function skuOf(original: string, color: string) {
  const parts = original.split('-');
  parts[3] = COLOR_CODE[color] ?? color.toUpperCase();
  return parts.join('-');
}

function sizeGroupOf(category: string, sizes: string[]) {
  const first = sizes[0];
  if (first === 'one') return 'hair';
  if (first.startsWith('kids-')) return 'kids';
  if (first === 'festival' || first === 'standard') return 'sock';
  if (category === 'tights') return 'tights';
  if (first === 'm' && sizes.includes('xxl')) return 'boxer';
  return 'briefs';
}

export async function catalogSeeder() {
  // ── colours ──
  const colorId = new Map<string, bigint>();
  for (const [i, c] of COLORS.entries()) {
    const row = await prisma.color.upsert({
      where: { key: c.key },
      update: {},
      create: { ...c, sortOrder: i + 1 },
    });
    colorId.set(c.key, row.id);
  }

  // ── sizes ──
  const sizeId = new Map<string, bigint>(); // `${group}:${key}`
  for (const [group, def] of Object.entries(SIZE_GROUPS)) {
    for (const [i, s] of def.sizes.entries()) {
      const row = await prisma.size.upsert({
        where: { sizeGroup_key: { sizeGroup: group, key: s.key } },
        update: {},
        create: { sizeGroup: group, key: s.key, label: s.label, note: s.note ?? null, sortOrder: i + 1 },
      });
      sizeId.set(`${group}:${s.key}`, row.id);
    }
  }

  // ── tags ──
  const tagId = new Map<string, bigint>();
  for (const [slug, name] of Object.entries(TAGS)) {
    const row = await prisma.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
    tagId.set(slug, row.id);
  }

  // ── editorial / category media ──
  for (const key of Object.keys(manifest).filter((k) => !k.includes('__'))) await mediaFor(key);

  // ── nested categories ──
  const categoryId = new Map<string, bigint>();
  for (const [i, c] of CATEGORIES.entries()) {
    const image = await mediaFor(c.image.replace('/images/', '').replace('.webp', ''), `دستهٔ ${c.name}`);
    const parent = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        accent: c.accent,
        imageId: image?.id ?? null,
        sortOrder: i + 1,
        metaTitle: c.name,
        metaDescription: c.description.slice(0, 155),
      },
    });
    categoryId.set(c.slug, parent.id);
    for (const [j, sub] of (SUBCATEGORIES[c.slug] ?? []).entries()) {
      const child = await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          slug: sub.slug,
          name: sub.name,
          tagline: sub.tagline ?? null,
          parentId: parent.id,
          imageId: image?.id ?? null,
          accent: c.accent,
          sortOrder: j + 1,
        },
      });
      categoryId.set(sub.slug, child.id);
      for (const p of sub.products) categoryId.set(`product:${p}`, child.id);
    }
  }

  // ── products ──
  let variantCount = 0;
  let imageCount = 0;
  let reviewCount = 0;
  for (const p of PRODUCTS) {
    const catId = categoryId.get(`product:${p.slug}`) ?? categoryId.get(p.category)!;
    const group = sizeGroupOf(p.category, p.sizes);
    const createdAt = new Date(`${p.createdAt}T09:00:00.000Z`);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        categoryId: catId,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description.join('\n\n'),
        audience: p.audience,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        material: p.details.material,
        care: p.details.care,
        origin: p.details.origin,
        highlights: p.highlights,
        status: 'active',
        isFeatured: p.tags.includes('recommended'),
        rating: p.rating,
        reviewCount: p.reviewCount,
        popularity: p.popularity,
        metaTitle: p.name,
        metaDescription: `${p.subtitle} — ${p.description[0].slice(0, 120)}`,
        publishedAt: createdAt,
        createdAt,
      },
    });

    // tags
    for (const t of p.tags) {
      const tid = tagId.get(t);
      if (!tid) continue;
      await prisma.productTag.upsert({
        where: { productId_tagId: { productId: product.id, tagId: tid } },
        update: {},
        create: { productId: product.id, tagId: tid },
      });
    }

    // variants
    for (const v of p.variants) {
      const sku = skuOf(v.sku, v.color);
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          colorId: colorId.get(v.color) ?? null,
          sizeId: sizeId.get(`${group}:${v.size}`) ?? null,
          sku,
          stock: v.stock,
          price: v.price ?? null,
        },
      });
      variantCount++;
    }

    // gallery: one image per (shot × colour)
    if ((await prisma.productImage.count({ where: { productId: product.id } })) === 0) {
      let order = 0;
      for (const color of p.colors) {
        for (const shot of p.shots) {
          const key = manifest[`${shot}__${color}`] ? `${shot}__${color}` : `${shot}__cream`;
          const media = await mediaFor(key, p.name);
          if (!media) continue;
          await prisma.productImage.create({
            data: { productId: product.id, mediaId: media.id, colorId: colorId.get(color) ?? null, sortOrder: order++ },
          });
          imageCount++;
        }
      }
    }

    // approved sample reviews
    if ((await prisma.review.count({ where: { productId: product.id } })) === 0) {
      const reviews = reviewsFor(p);
      for (const [i, r] of reviews.entries()) {
        await prisma.review.create({
          data: {
            productId: product.id,
            authorName: r.author,
            rating: r.rating,
            body: r.body,
            status: 'approved',
            isVerifiedBuyer: r.verified,
            createdAt: new Date(Date.now() - (i + 1) * 14 * 86_400_000),
          },
        });
        reviewCount++;
      }
    }
  }

  log(
    'CatalogSeeder',
    `${COLORS.length} colours, ${sizeId.size} sizes, ${tagId.size} tags, ${categoryId.size - PRODUCTS.length} categories, ` +
      `${PRODUCTS.length} products, ${variantCount} variants, ${imageCount} images, ${reviewCount} reviews`,
  );
}
