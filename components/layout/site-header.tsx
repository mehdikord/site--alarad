'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import type { CategoryNode } from '@/lib/types';
import { useCart, useHydrated, useAuth } from '@/lib/store';
import { cn } from '@/lib/utils';
import { num, toman } from '@/lib/format';
import { Sheet } from '@/components/ui/misc';

export function SiteHeader({ categories, freeShippingThreshold }: { categories: CategoryNode[]; freeShippingThreshold: number }) {
  const CATEGORIES = categories;
  const announcements = React.useMemo(
    () => [
      `ارسال رایگان برای خریدهای بالای ${toman(freeShippingThreshold)}`,
      'بازگشت آسان تا ۷ روز پس از دریافت',
      'پرداخت امن از طریق درگاه بانکی',
    ],
    [freeShippingThreshold],
  );
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
    const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(false);
  const [openSearch, setOpenSearch] = React.useState(false);
  const [hoverCat, setHoverCat] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const openCart = useCart((s) => s.open);
  const user = useAuth((s) => s.user);
  const hydrated = useHydrated();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12));

  React.useEffect(() => {
    setOpenMenu(false);
    setOpenSearch(false);
  }, [pathname]);

  const isHome = pathname === '/';
  const hovered = CATEGORIES.find((c) => c.slug === hoverCat) ?? null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSearch(false);
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : '/shop');
  };

  return (
    <>
      {/* announcement bar */}
      <div className="relative overflow-hidden border-b border-line-soft bg-cream-200/70">
        <div className="container-x flex h-9 items-center justify-center">
          <Announcement items={announcements} />
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-silk',
          scrolled || !isHome
            ? 'border-b border-line-soft bg-cream-50/85 backdrop-blur-xl supports-[backdrop-filter]:bg-cream-50/70'
            : 'bg-transparent',
        )}
      >
        <div className="container-x">
          <div className={cn('flex items-center justify-between gap-3 transition-[height] duration-400 ease-silk', scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20')}>
            {/* start: mobile menu + desktop nav */}
            <div className="flex flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => setOpenMenu(true)}
                className="-ms-2 flex size-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-cream-200 lg:hidden"
                aria-label="منوی اصلی"
              >
                <Menu className="size-5" strokeWidth={1.6} />
              </button>

              <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setHoverCat(null)}>
                {CATEGORIES.slice(0, 6).map((c) => {
                  const inTree = pathname === `/shop/${c.slug}` || c.children.some((ch) => pathname === `/shop/${ch.slug}` || ch.children.some((g) => pathname === `/shop/${g.slug}`));
                  return (
                  <div key={c.slug} onMouseEnter={() => setHoverCat(c.slug)}>
                    <Link
                      href={`/shop/${c.slug}`}
                      className={cn(
                        'relative inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.8125rem] transition-colors duration-300',
                        inTree ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900',
                      )}
                    >
                      {c.name}
                      {c.children.length > 0 && <ChevronDown className="size-3 text-ink-300" strokeWidth={2} />}
                      {inTree && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-3 -bottom-0.5 h-px bg-sage-500"
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                    </Link>
                  </div>
                  );
                })}
                <Link
                  href="/shop"
                  className="rounded-full px-3.5 py-2 text-[0.8125rem] text-ink-500 transition-colors hover:text-ink-900"
                >
                  همهٔ محصولات
                </Link>
              </nav>
            </div>

            {/* brand */}
            <Link href="/" className="group flex shrink-0 flex-col items-center" aria-label="الاردشاپ، صفحهٔ اصلی">
              <span className="text-[1.0625rem] font-semibold tracking-tight text-ink-900 sm:text-lg">الاردشاپ</span>
              <span className="mt-0.5 hidden text-[0.5625rem] tracking-[0.32em] text-ink-300 sm:block">A L A R A D</span>
            </Link>

            {/* end: actions */}
            <div className="flex flex-1 items-center justify-end gap-0.5">
              <button
                type="button"
                onClick={() => setOpenSearch((s) => !s)}
                className="flex size-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-cream-200"
                aria-label="جست‌وجو"
                aria-expanded={openSearch}
              >
                {openSearch ? <X className="size-[1.15rem]" strokeWidth={1.6} /> : <Search className="size-[1.15rem]" strokeWidth={1.6} />}
              </button>
              <Link
                href="/account"
                className="hidden size-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-cream-200 sm:flex"
                aria-label={user ? `حساب کاربری ${user.name}` : 'ورود به حساب'}
              >
                <User className="size-[1.15rem]" strokeWidth={1.6} />
              </Link>
              <button
                type="button"
                onClick={openCart}
                className="relative flex size-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-cream-200"
                aria-label={`سبد خرید${hydrated && cartCount ? `، ${num(cartCount)} کالا` : ''}`}
              >
                <ShoppingBag className="size-[1.15rem]" strokeWidth={1.6} />
                <AnimatePresence>
                  {hydrated && cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{scale: 0.5, opacity: 0}}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                      className="absolute -end-1.5 top-0.5 flex min-w-[17px] items-center justify-center rounded-full bg-sage-500 px-1 text-[0.625rem] font-medium leading-[18px] text-white"
                    >
                      {num(cartCount)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* desktop mega panel — nested categories */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{opacity: 0, y: -6}}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setHoverCat(hovered.slug)}
              onMouseLeave={() => setHoverCat(null)}
              className="absolute inset-x-0 top-full hidden border-b border-line-soft bg-cream-50/97 backdrop-blur-xl lg:block"
            >
              <div className="container-x grid grid-cols-[1.1fr_1.4fr_0.9fr] gap-8 py-8">
                <div>
                  {hovered.tagline && <p className="eyebrow mb-2">{hovered.tagline}</p>}
                  <h3 className="text-h2 text-ink-900">{hovered.name}</h3>
                  {hovered.description && (
                    <p className="mt-2 max-w-sm text-[0.8125rem] leading-[1.9] text-ink-500">
                      {hovered.description.length > 112 ? `${hovered.description.slice(0, 112)}…` : hovered.description}
                    </p>
                  )}
                  <Link
                    href={`/shop/${hovered.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-sage-700 transition-colors hover:text-sage-600"
                  >
                    مشاهدهٔ همهٔ {num(hovered.productCount)} محصول
                    <ChevronDown className="size-3.5 -rotate-90" strokeWidth={2} />
                  </Link>
                </div>
                <MegaLinks category={hovered} />
                <Link href={`/shop/${hovered.slug}`} className="group relative min-h-40 overflow-hidden rounded-xl bg-cream-200">
                  {hovered.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hovered.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* search panel */}
        <AnimatePresence>
          {openSearch && (
            <motion.div
              initial={{height: 0, opacity: 0}}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line-soft bg-cream-50/95 backdrop-blur-xl"
            >
              <form onSubmit={submitSearch} className="container-x py-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-ink-300" strokeWidth={1.8} />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جست‌وجو در جوراب، جوراب‌شلواری، اکسسوری مو…"
                    className="h-12 w-full rounded-full border border-line bg-white ps-11 pe-4 text-sm outline-none transition-all duration-300 placeholder:text-ink-300 focus:border-sage-400 focus:shadow-[0_0_0_4px_rgba(168,181,162,.16)]"
                    aria-label="جست‌وجوی محصول"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[0.6875rem] text-ink-300">پیشنهاد:</span>
                  {['جوراب نخی', 'جوراب‌شلواری شفاف', 'اسکرانچی ابریشم', 'شورت بی‌درز'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setQuery(t);
                        setOpenSearch(false);
                        router.push(`/shop?q=${encodeURIComponent(t)}`);
                      }}
                      className="rounded-full bg-cream-200 px-3 py-1 text-[0.6875rem] text-ink-600 transition-colors hover:bg-sage-100"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* mobile menu */}
      <Sheet open={openMenu} onClose={() => setOpenMenu(false)} side="end" title="منوی الاردشاپ">
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                onClick={() => setOpenMenu(false)}
                className="group relative overflow-hidden rounded-xl bg-cream-200 shadow-soft"
              >
                <div className="relative aspect-[4/5]">
                  {c.image && <img src={c.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/45 via-ink-900/5 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 text-[0.8125rem] font-medium text-cream-50">{c.name}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* nested category list */}
          <div className="mt-6 flex flex-col">
            {CATEGORIES.filter((c) => c.children.length > 0).map((c) => (
              <div key={c.slug} className="border-b border-line-soft">
                <button
                  type="button"
                  onClick={() => setOpenGroup((g) => (g === c.slug ? null : c.slug))}
                  aria-expanded={openGroup === c.slug}
                  className="flex w-full items-center justify-between py-3.5 text-[0.875rem] text-ink-800"
                >
                  {c.name}
                  <ChevronDown className={cn('size-4 text-ink-300 transition-transform', openGroup === c.slug && 'rotate-180')} strokeWidth={1.6} />
                </button>
                {openGroup === c.slug && (
                  <ul className="mb-3 space-y-0.5 ps-3">
                    <li>
                      <Link href={`/shop/${c.slug}`} onClick={() => setOpenMenu(false)} className="block py-2 text-[0.8125rem] text-sage-700">
                        همهٔ {c.name}
                      </Link>
                    </li>
                    {c.children.map((ch) => (
                      <li key={ch.slug}>
                        <Link href={`/shop/${ch.slug}`} onClick={() => setOpenMenu(false)} className="block py-2 text-[0.8125rem] text-ink-600">
                          {ch.name}
                        </Link>
                        {ch.children.length > 0 && (
                          <ul className="ps-3">
                            {ch.children.map((g) => (
                              <li key={g.slug}>
                                <Link href={`/shop/${g.slug}`} onClick={() => setOpenMenu(false)} className="block py-1.5 text-[0.75rem] text-ink-500">
                                  {g.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <nav className="mt-2 flex flex-col">
            {[
              { href: '/shop', label: 'همهٔ محصولات' },
              { href: '/shop?tag=new', label: 'تازه‌ها' },
              { href: '/shop?tag=bestseller', label: 'پرفروش‌ترین‌ها' },
              { href: '/account', label: 'حساب کاربری و سفارش‌ها' },
              { href: '/about', label: 'دربارهٔ الاردشاپ' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpenMenu(false)}
                className="flex items-center justify-between border-b border-line-soft py-3.5 text-[0.875rem] text-ink-800 transition-colors hover:text-sage-700"
              >
                {l.label}
                <ChevronDown className="size-4 -rotate-90 text-ink-300" strokeWidth={1.6} />
              </Link>
            ))}
          </nav>

          <div className="mt-6 rounded-xl bg-sage-50 p-4">
            <p className="text-[0.75rem] font-medium text-sage-700">نیاز به راهنمایی دارید؟</p>
            <p className="mt-1 text-[0.75rem] leading-[1.9] text-ink-500">
              پاسخ سؤال‌های پرتکرار دربارهٔ سایزبندی، ارسال و بازگشت کالا در صفحهٔ راهنما آمده است.
            </p>
            <Link href="/help" onClick={() => setOpenMenu(false)} className="mt-2 inline-block text-[0.75rem] text-sage-700 underline decoration-sage-300 underline-offset-4">
              راهنمای خرید
            </Link>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function Announcement({ items }: { items: string[] }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5200);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="relative h-4 overflow-hidden text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{opacity: 0, y: 10}}
          animate={{ opacity: 1, y: 0 }}
          exit={{opacity: 0, y: -10}}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[0.6875rem] text-ink-500"
        >
          {items[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/** children (and grandchildren) of the hovered root category */
function MegaLinks({ category }: { category: CategoryNode }) {
  if (!category.children.length) {
    return <p className="self-center text-[0.8125rem] text-ink-400">زیردسته‌ای برای این دسته تعریف نشده است.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
      {category.children.map((ch) => (
        <div key={ch.slug}>
          <Link href={`/shop/${ch.slug}`} className="text-[0.8125rem] font-medium text-ink-800 transition-colors hover:text-sage-700">
            {ch.name}
          </Link>
          {ch.tagline && !ch.children.length && <p className="mt-0.5 text-[0.6875rem] text-ink-400">{ch.tagline}</p>}
          {ch.children.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {ch.children.map((g) => (
                <li key={g.slug}>
                  <Link href={`/shop/${g.slug}`} className="text-[0.75rem] text-ink-500 transition-colors hover:text-sage-700">
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
