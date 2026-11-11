'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, User, Heart } from 'lucide-react';
import { useCart, useHydrated, useAuth } from '@/lib/store';
import { cn } from '@/lib/utils';
import { num } from '@/lib/format';

const TABS = [
  { href: '/', label: 'خانه', icon: Home },
  { href: '/shop', label: 'فروشگاه', icon: LayoutGrid },
  { href: '__cart', label: 'سبد خرید', icon: ShoppingBag },
  { href: '/account', label: 'حساب من', icon: User },
];

/** Instagram-driven mobile users get persistent, thumb-reachable navigation. */
export function MobileTabBar() {
  const pathname = usePathname();
  const openCart = useCart((s) => s.open);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);

  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/product') || pathname.startsWith('/cart');
  if (hidden) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-cream-50/92 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label="ناوبری اصلی موبایل"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isCart = href === '__cart';
          const active = !isCart && (href === '/' ? pathname === '/' : pathname.startsWith(href));
          return (
            <li key={href}>
              {isCart ? (
                <button
                  type="button"
                  onClick={openCart}
                  className="relative flex w-full flex-col items-center gap-1 pb-1 pt-2.5 text-ink-500 transition-colors active:text-ink-900"
                >
                  <span className="relative">
                    <Icon className="size-[1.15rem]" strokeWidth={1.6} />
                    {hydrated && count > 0 && (
                      <span className="absolute -end-2 -top-1.5 flex min-w-[15px] items-center justify-center rounded-full bg-sage-500 px-1 text-[0.5625rem] leading-[15px] text-white">
                        {num(count)}
                      </span>
                    )}
                  </span>
                  <span className="text-[0.625rem]">{label}</span>
                </button>
              ) : (
                <Link
                  href={href}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 pb-1 pt-2.5 transition-colors',
                    active ? 'text-ink-900' : 'text-ink-400',
                  )}
                >
                  <Icon className="size-[1.15rem]" strokeWidth={active ? 1.9 : 1.6} />
                  <span className={cn('text-[0.625rem]', active && 'font-medium')}>
                    {label === 'حساب من' && user ? user.name.split(' ')[0] : label}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
