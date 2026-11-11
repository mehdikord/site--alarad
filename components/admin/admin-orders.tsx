'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Search, Truck, X } from 'lucide-react';
import type { OrderStatus } from '@/lib/types';
import { useOrders, useHydrated, useUi } from '@/lib/store';
import { STATUS_META } from '@/lib/store/orders';
import { date, num, toman } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AdminPageHeader, Panel } from '@/components/admin/ui';

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'processing', label: 'آماده‌سازی' },
  { key: 'shipped', label: 'ارسال‌شده' },
  { key: 'delivered', label: 'تحویل‌شده' },
  { key: 'cancelled', label: 'لغو‌شده' },
];

export function AdminOrders() {
  const hydrated = useHydrated();
  const orders = useOrders((s) => s.orders);
  const advance = useOrders((s) => s.advance);
  const notify = useUi((s) => s.notify);
  const [filter, setFilter] = React.useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = React.useState('');

  const visible = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (query) {
      const q = query.trim().toLowerCase();
      return o.code.toLowerCase().includes(q) || o.address.fullName.includes(query) || o.address.phone.includes(q);
    }
    return true;
  });

  const counts = {
    all: orders.length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'pending').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <>
      <AdminPageHeader
        title="سفارش‌ها"
        description={`${num(orders.length)} سفارش · ${num(counts.processing)} در انتظار آماده‌سازی`}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" strokeWidth={1.9} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="کد سفارش، نام یا موبایل…"
            className="h-9 w-full rounded-lg border border-line bg-white ps-9 pe-3 text-[0.75rem] outline-none focus:border-sage-400"
          />
        </div>
        <div className="rail no-scrollbar flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[0.75rem] transition-colors',
                filter === f.key ? 'bg-ink-900 text-cream-50' : 'border border-line bg-white text-ink-500 hover:border-sage-400',
              )}
            >
              {f.label}
              <span className={cn('text-[0.5625rem]', filter === f.key ? 'text-cream-300' : 'text-ink-300')}>
                {num(counts[f.key === 'processing' ? 'processing' : (f.key as keyof typeof counts)] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Panel title="فهرست سفارش‌ها" description="برای تغییر وضعیت از دکمه‌های سمت چپ استفاده کنید">
        {!hydrated ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : visible.length ? (
          <ul className="divide-y divide-line-soft">
            {visible.map((o) => {
              const meta = STATUS_META[o.status];
              return (
                <motion.li
                  key={o.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[0.75rem] font-medium text-ink-900" dir="ltr">{o.code}</span>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[0.5625rem]', meta.tone)}>{meta.label}</span>
                      {o.coupon && (
                        <span className="rounded-full bg-cream-200 px-1.5 py-0.5 text-[0.5625rem] text-ink-500">{o.coupon.code}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.625rem] text-ink-400">
                      {o.address.fullName} · {date(o.createdAt)} · {o.shipping.title}
                    </p>
                  </div>

                  <div className="text-end">
                    <p className="text-[0.75rem] font-medium text-ink-900">{toman(o.totals.grandTotal)}</p>
                    <p className="text-[0.5625rem] text-ink-300">{num(o.totals.itemCount)} قلم</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {o.status === 'processing' && (
                      <button
                        onClick={() => {
                          advance(o.code, 'shipped');
                          notify(`${o.code}: ارسال شد.`, 'success');
                        }}
                        className="flex h-7 items-center gap-1 rounded-full bg-sage-100 px-2.5 text-[0.625rem] text-sage-700 transition-colors hover:bg-sage-200"
                      >
                        <Truck className="size-3" strokeWidth={2} />
                        ارسال
                      </button>
                    )}
                    {o.status === 'shipped' && (
                      <button
                        onClick={() => {
                          advance(o.code, 'delivered');
                          notify(`${o.code}: تحویل شد.`, 'success');
                        }}
                        className="flex h-7 items-center gap-1 rounded-full bg-sage-500 px-2.5 text-[0.625rem] text-white transition-colors hover:bg-sage-600"
                      >
                        <Check className="size-3" strokeWidth={2.6} />
                        تحویل
                      </button>
                    )}
                    {o.status !== 'cancelled' && o.status !== 'delivered' && (
                      <button
                        onClick={() => {
                          advance(o.code, 'cancelled');
                          notify(`${o.code}: لغو شد.`);
                        }}
                        aria-label="لغو سفارش"
                        className="flex size-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-blush-100 hover:text-blush-500"
                      >
                        <X className="size-3.5" strokeWidth={2.2} />
                      </button>
                    )}
                    <Link
                      href={`/account/orders/${o.code}`}
                      className="flex size-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-cream-200 hover:text-ink-900"
                      aria-label="جزئیات"
                    >
                      <ArrowLeft className="size-3.5" strokeWidth={2} />
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        ) : (
          <p className="py-10 text-center text-[0.8125rem] text-ink-400">سفارشی با این فیلتر وجود ندارد.</p>
        )}
      </Panel>
    </>
  );
}
