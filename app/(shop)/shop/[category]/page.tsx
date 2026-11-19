import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { findCategory, getCategoryTree } from '@/lib/services/catalog';
import { loadShop } from '@/lib/services/shop-page';
import { ShopFacetsProvider } from '@/components/shop/facets';
import { ShopToolbar, ActiveFilterChips } from '@/components/shop/shop-toolbar';
import { FilterPanel } from '@/components/shop/filter-panel';
import { ProductGrid } from '@/components/product/product-grid';
import { EmptyState } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/button';
import { PLACEHOLDER_BLUR } from '@/lib/images';
import { num } from '@/lib/format';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const found = await findCategory(decodeURIComponent(category));
  if (!found) return { title: 'دسته یافت نشد' };
  const cat = found.category;
  return {
    title: cat.metaTitle || cat.name,
    description: (cat.metaDescription || cat.description || cat.tagline).slice(0, 155),
    openGraph: { title: `${cat.name} — الاردشاپ`, images: cat.image ? [cat.image] : undefined },
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
  const found = await findCategory(decodeURIComponent(category));
  if (!found) notFound();
  const { category: cat, node, path, descendantIds } = found;

  const sp = await searchParams;
  const base = `/shop/${cat.slug}`;
  const [{ query, results, products, facets, activeCount }, tree] = await Promise.all([
    loadShop(sp, { slug: cat.slug, ids: descendantIds }),
    getCategoryTree(),
  ]);
  // sub-categories of this node; leaves show their siblings instead
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const findChildren = (id: number | null) => {
    if (id === null) return tree;
    const stack = [...tree];
    while (stack.length) {
      const n = stack.shift()!;
      if (n.id === id) return n.children;
      stack.push(...n.children);
    }
    return [];
  };
  const children = node.children;
  const siblings = findChildren(parent ? parent.id : null).filter((c) => c.id !== cat.id);
  const heroImage = cat.image ?? path.find((p) => p.image)?.image ?? null;
  const heroBlur = cat.imageBlur ?? path.find((p) => p.imageBlur)?.imageBlur ?? PLACEHOLDER_BLUR;
  const description = cat.description || path.slice().reverse().find((p) => p.description)?.description || '';

  return (
    <ShopFacetsProvider value={facets}>
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
                {path.slice(0, -1).map((p) => (
                  <span key={p.id} className="contents">
                    <span>/</span>
                    <Link href={`/shop/${p.slug}`} className="transition-colors hover:text-ink-700">{p.name}</Link>
                  </span>
                ))}
                <span>/</span>
                <span className="text-ink-500">{cat.name}</span>
              </nav>
              {cat.tagline && <p className="eyebrow mb-2">{cat.tagline}</p>}
              <h1 className="text-[1.75rem] font-semibold leading-[1.32] text-ink-900 sm:text-[2.25rem]">{cat.name}</h1>
              {description && <p className="prose-fa mt-3 max-w-[46ch] text-[0.8125rem] sm:text-sm">{description}</p>}
              {children.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-[0.6875rem] text-ink-400">زیردسته‌ها</p>
                  <div className="flex flex-wrap gap-2">
                    {children.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop/${c.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-white px-3.5 py-1.5 text-[0.75rem] text-ink-700 transition-colors hover:border-sage-400 hover:text-sage-700"
                      >
                        {c.name}
                        <span className="text-[0.625rem] text-ink-300">{num(c.productCount)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {siblings.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {parent && (
                    <Link
                      href={`/shop/${parent.slug}`}
                      className="rounded-full border border-line bg-cream-50/70 px-3 py-1.5 text-[0.6875rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
                    >
                      همهٔ {parent.name}
                    </Link>
                  )}
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
              )}
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl shadow-soft sm:aspect-[16/9] lg:aspect-[4/3]">
              <Image
                src={heroImage ?? '/images/hero.webp'}
                alt={`دستهٔ ${cat.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                placeholder="blur"
                blurDataURL={heroBlur}
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
    </ShopFacetsProvider>
  );
}
