import type { Metadata } from 'next';
import Link from 'next/link';
import { TAG_LABELS } from '@/lib/shop';
import { loadShop } from '@/lib/services/shop-page';
import { getCategoryTree } from '@/lib/services/catalog';
import { ShopFacetsProvider } from '@/components/shop/facets';
import { ShopToolbar, ActiveFilterChips } from '@/components/shop/shop-toolbar';
import { FilterPanel } from '@/components/shop/filter-panel';
import { ProductGrid } from '@/components/product/product-grid';
import { EmptyState } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/button';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'فروشگاه — همهٔ محصولات',
  description: 'خرید آنلاین جوراب، جوراب‌شلواری، اکسسوری مو و شورت زنانه، مردانه و کودکان با فیلتر رنگ، سایز و قیمت.',
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [{ query, results, products, facets, activeCount }, categories] = await Promise.all([loadShop(params), getCategoryTree()]);

  const heading = query.tag && TAG_LABELS[query.tag] ? TAG_LABELS[query.tag] : "همهٔ محصولات";

  return (
    <ShopFacetsProvider value={facets}>
    <div className="pt-5 sm:pt-8">
      <div className="container-x">
        {/* breadcrumb + heading */}
        <nav aria-label="مسیر" className="mb-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-300">
          <Link href="/" className="transition-colors hover:text-ink-700">خانه</Link>
          <span>/</span>
          <span className="text-ink-500">فروشگاه</span>
        </nav>

        <div className="mb-5">
          <h1 className="text-h1 text-ink-900">{heading}</h1>
          <p className="mt-1.5 max-w-xl text-[0.8125rem] leading-[1.9] text-ink-500">
            {num(results.length)} محصول از {num(categories.length)} دستهٔ الاردشاپ — با فیلتر رنگ و سایز، دقیقاً همان چیزی را پیدا کنید که می‌خواهید.
          </p>
        </div>

        {/* category pills */}
        <div className="rail no-scrollbar -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CategoryPill href="/shop" active={!query.tag} label="همه" />
          {categories.map((c) => (
            <CategoryPill key={c.slug} href={`/shop/${c.slug}`} active={false} label={c.name} />
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {['new', 'bestseller', 'gift', 'winter'].map((t) => (
            <CategoryPill key={t} href={`/shop?tag=${t}`} active={query.tag === t} label={TAG_LABELS[t]} soft />
          ))}
        </div>

        <ShopToolbar query={query} base="/shop" resultCount={results.length} activeCount={activeCount} />
        <ActiveFilterChips query={query} base="/shop" />

        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* desktop filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <FilterPanel query={query} base="/shop" resultCount={results.length} />
            </div>
          </aside>

          <div>
            {products.length ? (
              <ProductGrid products={products} priorityCount={4} />
            ) : (
              <EmptyState
                variant="search"
                title="چیزی با این فیلترها پیدا نشد"
                description="فیلترها را کمی بازتر کنید یا از دسته‌های دیگر شروع کنید — محصولات تازه هر هفته اضافه می‌شود."
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ButtonLink href="/shop" variant="primary" size="md">پاک کردن فیلترها</ButtonLink>
                    <ButtonLink href="/shop?sort=newest" variant="outline" size="md">دیدن تازه‌ها</ButtonLink>
                  </div>
                }
              />
            )}

            {products.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-2 border-t border-line-soft pt-8 text-center">
                <p className="text-[0.75rem] text-ink-400">همهٔ {num(products.length)} محصول نمایش داده شد</p>
                <p className="max-w-sm text-[0.6875rem] leading-relaxed text-ink-300">
                  اگر سایز یا رنگ مورد نظرتان نبود، به‌زودی شارژ می‌شود. می‌توانید از دسته‌های دیگر الهام بگیرید.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ShopFacetsProvider>
  );
}

function CategoryPill({ href, label, active, soft }: { href: string; label: string; active: boolean; soft?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[0.75rem] transition-all duration-300 ease-silk',
        active
          ? 'border-ink-900 bg-ink-900 text-cream-50'
          : soft
            ? 'border-transparent bg-cream-200/70 text-ink-500 hover:bg-cream-300/80'
            : 'border-line bg-white text-ink-600 hover:border-sage-400 hover:text-sage-700',
      )}
    >
      {label}
    </Link>
  );
}
