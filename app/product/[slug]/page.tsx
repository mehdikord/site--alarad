import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCTS, productBySlug, relatedProducts, reviewsFor, stockMatrixOf } from '@/lib/data/products';
import { CATEGORIES } from '@/lib/data/categories';
import { toCardData } from '@/lib/card';
import { ProductDetail, StickyBuyBarSpacer } from '@/components/product/product-detail';
import { ProductGrid } from '@/components/product/product-grid';
import { ReviewsBlock } from '@/components/product/reviews-block';
import { SectionHeader } from '@/components/ui/misc';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return { title: 'محصول یافت نشد' };
  return {
    title: product.name,
    description: `${product.subtitle} — ${product.description[0].slice(0, 120)}`,
    openGraph: {
      title: product.name,
      description: product.subtitle,
      images: [`/images/${product.shots[0]}__${product.colors[0]}.webp`],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.slug === product.category)!;
  const matrix = stockMatrixOf(product);
  const reviews = reviewsFor(product);
  const related = relatedProducts(product, 4).map((p) => toCardData(p));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description[0],
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
          <Link href={`/shop/${category.slug}`} className="transition-colors hover:text-ink-700">{category.name}</Link>
          <span>/</span>
          <span className="line-clamp-1 max-w-[16rem] text-ink-500">{product.name}</span>
        </nav>

        <ProductDetail product={product} stockMatrix={matrix} categoryName={category.name} />
        <StickyBuyBarSpacer />

        <div className="mt-14">
          <ReviewsBlock reviews={reviews} rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-14 pb-6">
          <SectionHeader eyebrow="شاید بپسندید" title="محصولات مرتبط" description="انتخاب‌هایی با همان زبان رنگ و بافت." />
          <ProductGrid products={related} columns={4} />
        </div>
      </div>
    </div>
  );
}
