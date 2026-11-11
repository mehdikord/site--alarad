'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Boxes, Menu, Package, ReceiptText, X, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { num } from '@/lib/format';
import { useOrders, useHydrated, useCatalog } from '@/lib/store';
import { PRODUCTS } from '@/lib/data/products';

const NAV = [
  { href: '/admin', label: 'داشبورد', icon: BarChart3 },
  { href: '/admin/products', label: 'محصولات', icon: Package },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: ReceiptText },
  { href: '/admin/inventory', label: 'موجودی انبار', icon: Boxes },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const orders = useOrders((s) => s.orders);
  const hydrated = useHydrated();
  const stockMap = useCatalog((s) => s.stock);
  const custom = useCatalog((s) => s.custom);

  const lowStockCount = React.useMemo(
    () =>
      [...PRODUCTS, ...custom]
        .flatMap((p) => p.variants)
        .filter((v) => (stockMap[v.id] ?? v.stock) <= 5).length,
    [custom, stockMap],
  );
  const openOrders = orders.filter((o) => o.status === 'processing' || o.status === 'pending').length;

  React.useEffect(() => setOpen(false), [pathname]);

  const aside = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2 px-4 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-ink-900 text-[0.625rem] font-semibold text-cream-50">
          ا
        </span>
        <div>
          <p className="text-[0.8125rem] font-semibold text-ink-900">پنل الاردشاپ</p>
          <p className="text-[0.5625rem] text-ink-400">مدیریت فروشگاه</p>
        </div>
      </Link>

      <nav className="mt-1 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          const badge =
            href === '/admin/orders' && hydrated && openOrders ? num(openOrders) : href === '/admin/inventory' && hydrated && lowStockCount ? num(lowStockCount) : null;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.8125rem] transition-colors',
                active ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:bg-white/60 hover:text-ink-800',
              )}
            >
              <Icon className={cn('size-4', active ? 'text-sage-600' : 'text-ink-400')} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="rounded-full bg-blush-100 px-1.5 py-0.5 text-[0.5625rem] text-blush-500">{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line-soft p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.75rem] text-ink-500 transition-colors hover:bg-white/60 hover:text-ink-800"
        >
          <Store className="size-3.5" strokeWidth={1.8} />
          مشاهدهٔ فروشگاه
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-cream-100">
      <div className="mx-auto flex max-w-[1400px]">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 border-e border-line-soft bg-cream-200/50 lg:block">
          {aside}
        </aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[80] lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink-900/25 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                className="absolute inset-y-0 start-0 w-64 bg-cream-50 shadow-float"
              >
                <button
                  onClick={() => setOpen(false)}
                  aria-label="بستن منو"
                  className="absolute end-3 top-4 flex size-8 items-center justify-center rounded-full text-ink-400 hover:bg-cream-200"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
                {aside}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          {/* mobile topbar */}
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line-soft bg-cream-50/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button onClick={() => setOpen(true)} aria-label="منو" className="flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-cream-200">
              <Menu className="size-5" strokeWidth={1.8} />
            </button>
            <p className="text-[0.8125rem] font-semibold text-ink-900">پنل مدیریت</p>
            <Link href="/" className="flex size-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-200" aria-label="فروشگاه">
              <Store className="size-4" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
