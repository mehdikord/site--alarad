import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProductMeta, relatedProducts, approvedReviews } from '@/lib/services/catalog';
import { toCardData } from '@/lib/card';
import { getSettings } from '@/lib/settings';
import { getUser } from '@/lib/auth/user';
import { db } from '@/lib/db';
import type { Product } from '@/lib/types';
import { ProductDetail, StickyBuyBarSpacer } from '@/components/product/product-detail';
import { ProductGrid } from '@/components/product/product-grid';
import { ReviewsBlock } from '@/components/product/reviews-block';
import { SectionHeader } from '@/components/ui/misc';

/** colour → size → stock */
function stockMatrixOf(product: Product) {
  const matrix: Record<string, Record<string, number>> = {};
  for (const c of product.colors) {
    matrix[c] = {};
    for (const s of product.sizes) matrix[c][s] = product.variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;
  }
  return matrix;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getProductMeta(decodeURIComponent(slug));
  if (!meta) return { title: 'محصول یافت نشد' };
  return {
    title: meta.metaTitle || meta.name,
    description: meta.metaDescription || meta.subtitle || meta.name,
    openGraph: {
      title: meta.name,
      description: meta.subtitle ?? undefined,
      images: meta.images[0] ? [meta.images[0].media.url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  if (!product) notFound();

  const [reviews, relatedRaw, settings, user] = await Promise.all([
    approvedReviews(product.id),
    relatedProducts(product, 4),
    getSettings(),
    getUser(),
  ]);
  const matrix = stockMatrixOf(product);
  const related = relatedRaw.map(toCardData);
  const wishlisted = user
    ? !!(await db.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId: BigInt(product.id) } } }))
    : false;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description[0] ?? product.subtitle,
    image: product.images.slice(0, 4).map((i) => i.src),
    brand: { '@type': 'Brand', name: 'الاردشاپ' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IRR',
      availability: Object.values(matrix).some((s) => Object.values(s).some((n) => n > 0))
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="pt-4 sm:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-x">
        <nav aria-label="مسیر" className="mb-4 flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-ink-300">
          <Link href="/" className="transition-colors hover:text-ink-700">خانه</Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:text-ink-700">فروشگاه</Link>
          <span>/</span>
          {product.categoryPath.map((c) => (
            <span key={c.slug} className="contents">
              <Link href={`/shop/${c.slug}`} className="transition-colors hover:text-ink-700">{c.name}</Link>
              <span>/</span>
            </span>
          ))}
          <span className="line-clamp-1 max-w-[16rem] text-ink-500">{product.name}</span>
        </nav>

        <ProductDetail
          product={product}
          stockMatrix={matrix}
          categoryName={product.categoryName}
          freeShippingThreshold={settings.freeShippingThreshold}
          wishlisted={wishlisted}
        />
        <StickyBuyBarSpacer />

        <div className="mt-14">
          <ReviewsBlock reviews={reviews} rating={product.rating} reviewCount={product.reviewCount} productId={product.id} />
        </div>

        <div className="mt-14 pb-6">
          <SectionHeader eyebrow="شاید بپسندید" title="محصولات مرتبط" description="انتخاب‌هایی با همان زبان رنگ و بافت." />
          {related.length > 0 && <ProductGrid products={related} columns={4} />}
        </div>
      </div>
    </div>
  );
}
