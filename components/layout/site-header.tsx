'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/data/categories';
import { useCart, useHydrated, useAuth } from '@/lib/store';
import { cn } from '@/lib/utils';
import { num } from '@/lib/format';
import { Sheet } from '@/components/ui/misc';

const ANNOUNCEMENTS = [
  'ارسال رایگان برای خریدهای بالای ۵۰۰٬۰۰۰ تومان',
  'بازگشت آسان تا ۷ روز پس از دریافت',
  'پرداخت امن از طریق درگاه بانکی',
];

export function SiteHeader() {
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
  const isAdmin = pathname.startsWith('/admin');
  if (isAdmin) return null;

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
          <Announcement />
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
                {CATEGORIES.map((c) => (
                  <div key={c.slug} onMouseEnter={() => setHoverCat(c.slug)}>
                    <Link
                      href={`/shop/${c.slug}`}
                      className={cn(
                        'relative rounded-full px-3.5 py-2 text-[0.8125rem] transition-colors duration-300',
                        pathname === `/shop/${c.slug}` ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900',
                      )}
                    >
                      {c.name}
                      {pathname === `/shop/${c.slug}` && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-3 -bottom-0.5 h-px bg-sage-500"
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                    </Link>
                  </div>
                ))}
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

        {/* desktop mega panel */}
        <AnimatePresence>
          {hoverCat && (
            <motion.div
              initial={{opacity: 0, y: -6}}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setHoverCat(hoverCat)}
              onMouseLeave={() => setHoverCat(null)}
              className="absolute inset-x-0 top-full hidden border-b border-line-soft bg-cream-50/97 backdrop-blur-xl lg:block"
            >
              <div className="container-x grid grid-cols-[1.2fr_1fr_1fr] gap-8 py-8">
                <div>
                  <p className="eyebrow mb-2">{CATEGORIES.find((c) => c.slug === hoverCat)?.tagline}</p>
                  <h3 className="text-h2 text-ink-900">{CATEGORIES.find((c) => c.slug === hoverCat)?.name}</h3>
                  <p className="mt-2 max-w-sm text-[0.8125rem] leading-[1.9] text-ink-500">
                    {CATEGORIES.find((c) => c.slug === hoverCat)?.description.slice(0, 112)}…
                  </p>
                  <Link
                    href={`/shop/${hoverCat}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-sage-700 transition-colors hover:text-sage-600"
                  >
                    مشاهدهٔ همهٔ محصولات
                    <ChevronDown className="size-3.5 -rotate-90" strokeWidth={2} />
                  </Link>
                </div>
                <MegaLinks category={hoverCat} />
                <Link href={`/shop/${hoverCat}`} className="group relative overflow-hidden rounded-xl bg-cream-200">
                  <img
                    src={CATEGORIES.find((c) => c.slug === hoverCat)?.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
                    loading="lazy"
                  />
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
                  <img src={c.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/45 via-ink-900/5 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 text-[0.8125rem] font-medium text-cream-50">{c.name}</span>
                </div>
              </Link>
            ))}
          </div>

          <nav className="mt-6 flex flex-col">
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

function Announcement() {
  const [i, setI] = React.useState(0);
    React.useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ANNOUNCEMENTS.length), 5200);
    return () => clearInterval(t);
  }, []);
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
          {ANNOUNCEMENTS[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

const MEGA_GROUPS: Record<string, { title: string; links: { label: string; href: string }[] }[]> = {
  socks: [
    { title: 'بر اساس مدل', links: [{ label: 'مچی و ساق کوتاه', href: '/shop/socks?q=مچی' }, { label: 'ساق بلند', href: '/shop/socks?q=ساق' }, { label: 'بافت زمستانی', href: '/shop/socks?q=زمستان' }] },
    { title: 'بر اساس مخاطب', links: [{ label: 'زنانه', href: '/shop/socks?audience=women' }, { label: 'مردانه', href: '/shop/socks?audience=men' }, { label: 'کودکان', href: '/shop/socks?audience=kids' }] },
  ],
  tights: [
    { title: 'بر اساس ضخامت', links: [{ label: 'شفاف ۲۰ دنیر', href: '/shop/tights?q=۲۰' }, { label: 'مات ۴۰ دنیر', href: '/shop/tights?q=۴۰' }, { label: 'ضخیم زمستانی', href: '/shop/tights?q=زمستان' }] },
    { title: 'ویژه', links: [{ label: 'کمر بلند فرم‌دهنده', href: '/shop/tights?q=فرم' }, { label: 'لبه‌توری', href: '/shop/tights?q=توری' }, { label: 'پک چند عددی', href: '/shop/tights?q=پک' }] },
  ],
  hair: [
    { title: 'اسکرانچی', links: [{ label: 'ابریشم درشت', href: '/shop/hair?q=درشت' }, { label: 'پک هدیه', href: '/shop/hair?q=پک' }] },
    { title: 'گیره و کش', links: [{ label: 'گیرهٔ مرواریدنشان', href: '/shop/hair?q=مروارید' }, { label: 'کش پارچه‌ای', href: '/shop/hair?q=پارچه' }, { label: 'هدبند', href: '/shop/hair?q=هدبند' }] },
  ],
  underwear: [
    { title: 'زنانه', links: [{ label: 'بی‌درز', href: '/shop/underwear?q=درز' }, { label: 'لبه‌توری', href: '/shop/underwear?q=توری' }, { label: 'کمر بلند', href: '/shop/underwear?q=بلند' }] },
    { title: 'مردانه و کودکان', links: [{ label: 'بوکسور مردانه', href: '/shop/underwear?audience=men' }, { label: 'زیرپوش مردانه', href: '/shop/underwear?q=زیرپوش' }, { label: 'کودکان', href: '/shop/underwear?audience=kids' }] },
  ],
};

function MegaLinks({ category }: { category: string }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {(MEGA_GROUPS[category] ?? []).map((g) => (
        <div key={g.title}>
          <p className="mb-2 text-[0.6875rem] font-medium text-ink-300">{g.title}</p>
          <ul className="space-y-1.5">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[0.8125rem] text-ink-600 transition-colors hover:text-sage-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
