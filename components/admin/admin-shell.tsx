'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Boxes, CreditCard, FolderTree, Image as ImageIcon, LogOut, Mail, Menu, MessageSquareText, Package,
  Palette, ReceiptText, Settings, ShieldCheck, Store, TicketPercent, Truck, Users, X, MapPinned,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { num } from '@/lib/format';

export interface ShellBadges {
  orders: number;
  lowStock: number;
  reviews: number;
}

const NAV: { title?: string; items: { href: string; label: string; icon: React.ElementType; badge?: keyof ShellBadges }[] }[] = [
  { items: [{ href: '/admins', label: 'داشبورد', icon: BarChart3 }] },
  {
    title: 'فروش',
    items: [
      { href: '/admins/orders', label: 'سفارش‌ها', icon: ReceiptText, badge: 'orders' },
      { href: '/admins/shipments', label: 'ارسال مرسوله‌ها', icon: Truck },
      { href: '/admins/payments', label: 'تراکنش‌های پرداخت', icon: CreditCard },
    ],
  },
  {
    title: 'کاتالوگ',
    items: [
      { href: '/admins/products', label: 'محصولات', icon: Package },
      { href: '/admins/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
      { href: '/admins/attributes', label: 'رنگ، سایز و برچسب', icon: Palette },
      { href: '/admins/inventory', label: 'موجودی انبار', icon: Boxes, badge: 'lowStock' },
      { href: '/admins/media', label: 'رسانه', icon: ImageIcon },
    ],
  },
  {
    title: 'مشتریان و بازاریابی',
    items: [
      { href: '/admins/users', label: 'کاربران', icon: Users },
      { href: '/admins/reviews', label: 'نظرها', icon: MessageSquareText, badge: 'reviews' },
      { href: '/admins/coupons', label: 'کدهای تخفیف', icon: TicketPercent },
      { href: '/admins/newsletter', label: 'خبرنامه', icon: Mail },
    ],
  },
  {
    title: 'تنظیمات',
    items: [
      { href: '/admins/shipping', label: 'روش‌های ارسال', icon: Truck },
      { href: '/admins/locations', label: 'استان‌ها و شهرها', icon: MapPinned },
      { href: '/admins/admins', label: 'مدیران سیستم', icon: ShieldCheck },
      { href: '/admins/settings', label: 'تنظیمات فروشگاه', icon: Settings },
    ],
  },
];

export function AdminShell({
  admin,
  badges,
  logout,
  children,
}: {
  admin: { name: string; phone: string };
  badges: ShellBadges;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [pathname]);

  const aside = (
    <div className="flex h-full flex-col">
      <Link href="/admins" className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-ink-900 text-[0.75rem] font-semibold text-cream-50">ا</span>
        <div>
          <p className="text-[0.875rem] font-semibold text-ink-900">پنل الاردشاپ</p>
          <p className="text-[0.625rem] text-ink-400">مدیریت فروشگاه</p>
        </div>
      </Link>

      <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.title && <p className="mb-1 px-3 text-[0.625rem] font-medium text-ink-300">{group.title}</p>}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const active = href === '/admins' ? pathname === '/admins' : pathname.startsWith(href);
                const count = badge ? badges[badge] : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] transition-colors',
                      active ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:bg-white/60 hover:text-ink-800',
                    )}
                  >
                    <Icon className={cn('size-4 shrink-0', active ? 'text-sage-600' : 'text-ink-400')} strokeWidth={1.8} />
                    <span className="flex-1 truncate">{label}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-blush-100 px-1.5 py-0.5 text-[0.625rem] font-medium text-blush-500">{num(count)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line-soft p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-sage-100 text-[0.75rem] font-medium text-sage-700">
            {admin.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.75rem] font-medium text-ink-900">{admin.name}</p>
            <p className="text-[0.625rem] text-ink-400" dir="ltr">{admin.phone}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Link href="/" target="_blank" className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[0.6875rem] text-ink-500 hover:bg-white/60 hover:text-ink-800">
            <Store className="size-3.5" strokeWidth={1.8} />
            فروشگاه
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[0.6875rem] text-ink-500 hover:bg-blush-100 hover:text-blush-500">
              <LogOut className="size-3.5" strokeWidth={1.8} />
              خروج
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-cream-100">
      <div className="flex">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-e border-line-soft bg-cream-200/50 lg:block">{aside}</aside>

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
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
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
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line-soft bg-cream-50/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button onClick={() => setOpen(true)} aria-label="منو" className="flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-cream-200">
              <Menu className="size-5" strokeWidth={1.8} />
            </button>
            <p className="text-[0.8125rem] font-semibold text-ink-900">پنل مدیریت</p>
            <Link href="/" className="flex size-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-200" aria-label="فروشگاه">
              <Store className="size-4" strokeWidth={1.8} />
            </Link>
          </div>
          <div className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
