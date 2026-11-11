import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/lib/data/categories';
import { PRODUCTS } from '@/lib/data/products';
import { parseQuery, filterProducts, sortProducts, buildHref } from '@/lib/shop';
import { toCardData } from '@/lib/card';
import { ShopToolbar, ActiveFilterChips } from '@/components/shop/shop-toolbar';
import { FilterPanel } from '@/components/shop/filter-panel';
import { ProductGrid } from '@/components/product/product-grid';
import { EmptyState } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/button';
import { blurOf } from '@/lib/images';
import { num } from '@/lib/format';
import { PRICE_BOUNDS } from '@/lib/data/products';

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) return { title: 'دسته یافت نشد' };
  return {
    title: cat.name,
    description: cat.description.slice(0, 155),
    openGraph: { title: `${cat.name} — الاردشاپ`, images: [cat.image] },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  const sp = await searchParams;
  const query = parseQuery(sp, category);
  const base = `/shop/${category}`;
  const results = sortProducts(filterProducts(query, PRODUCTS), query.sort);
  const products = results.map((p) => toCardData(p));
  const siblings = CATEGORIES.filter((c) => c.slug !== category);
  const activeCount =
    query.colors.length +
    query.sizes.length +
    (query.audience ? 1 : 0) +
    (query.min > PRICE_BOUNDS.min || query.max < PRICE_BOUNDS.max ? 1 : 0);

  return (
    <div>
      {/* category hero — large, calm, image-led */}
      <section className="relative overflow-hidden border-b border-line-soft bg-cream-100">
        <div className="container-x">
          <div className="grid items-center gap-6 py-7 sm:py-10 lg:grid-cols-[1fr_0.85fr] lg:gap-12">
            <div>
              <nav aria-label="مسیر" className="mb-4 flex items-center gap-1.5 text-[0.6875rem] text-ink-300">
                <Link href="/" className="transition-colors hover:text-ink-700">خانه</Link>
                <span>/</span>
                <Link href="/shop" className="transition-colors hover:text-ink-700">فروشگاه</Link>
                <span>/</span>
                <span className="text-ink-500">{cat.name}</span>
              </nav>
              <p className="eyebrow mb-2">{cat.tagline}</p>
              <h1 className="text-[1.75rem] font-semibold leading-[1.32] text-ink-900 sm:text-[2.25rem]">{cat.name}</h1>
              <p className="prose-fa mt-3 max-w-[46ch] text-[0.8125rem] sm:text-sm">{cat.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/shop/${s.slug}`}
                    className="rounded-full border border-line bg-cream-50/70 px-3 py-1.5 text-[0.6875rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
                  >
                    ← {s.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl shadow-soft sm:aspect-[16/9] lg:aspect-[4/3]">
              <Image
                src={cat.image}
                alt={`دستهٔ ${cat.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                placeholder="blur"
                blurDataURL={blurOf(cat.image.replace('/images/', '').replace('.webp', ''))}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-x pt-5 sm:pt-7">
        <ShopToolbar query={query} base={base} resultCount={results.length} activeCount={activeCount} />
        <ActiveFilterChips query={query} base={base} />

        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <FilterPanel query={query} base={base} resultCount={results.length} />
            </div>
          </aside>

          <div>
            {products.length ? (
              <ProductGrid products={products} priorityCount={4} />
            ) : (
              <EmptyState
                variant="search"
                title="در این دسته با فیلترهای فعلی چیزی نیست"
                description="فیلتر رنگ یا سایز را بردارید، یا نگاهی به بقیهٔ دسته‌ها بیندازید."
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ButtonLink href={base} variant="primary" size="md">پاک کردن فیلترها</ButtonLink>
                    <ButtonLink href="/shop" variant="outline" size="md">همهٔ محصولات</ButtonLink>
                  </div>
                }
              />
            )}

            {/* sizing guide nudge — high-trust content at the end of the grid */}
            <div className="mt-12 rounded-xl border border-line-soft bg-cream-100/80 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.8125rem] font-medium text-ink-900">در انتخاب سایز شک دارید؟</p>
                  <p className="mt-1 max-w-md text-[0.75rem] leading-[1.9] text-ink-500">
                    راهنمای سایزبندی الاردشاپ بر اساس قد و دور باسن تنظیم شده — اگر سایز شما مرز بین دو عدد بود، سایز بزرگ‌تر را انتخاب کنید.
                  </p>
                </div>
                <ButtonLink href="/help#sizes" variant="outline" size="md" className="shrink-0">
                  راهنمای سایز
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
