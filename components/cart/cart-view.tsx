'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Trash2, Truck } from 'lucide-react';
import { useCart, useHydrated } from '@/lib/store';
import { money, num, toman } from '@/lib/format';
import { colorOf, sizeLabel } from '@/lib/data/taxonomy';
import { QuantityStepper, EmptyState } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/button';
import { OrderSummary } from '@/components/cart/order-summary';
import { computeTotals, freeShippingProgress } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export function CartView() {
  const hydrated = useHydrated();
  const { items, setQty, remove } = useCart();
  const [coupon, setCoupon] = React.useState<{ code: string; amount: number; label?: string } | null>(null);
  const totals = computeTotals(items);
  const progress = freeShippingProgress(totals.subtotal);

  if (!hydrated) {
    return (
      <div className="container-x py-10">
        <div className="skeleton h-7 w-40 rounded-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x">
        <EmptyState
          variant="bag"
          title="سبد خرید شما خالی است"
          description="چند قلم از انتخاب‌های آرام ما را ببینید؛ از تازه‌ترین‌ها یا پرفروش‌ترین‌ها شروع کنید."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink href="/shop" variant="primary" size="md">
                مشاهدهٔ محصولات
              </ButtonLink>
              <ButtonLink href="/shop?tag=bestseller" variant="outline" size="md">
                پرفروش‌ترین‌ها
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-x pt-5 sm:pt-8">
      <nav aria-label="مسیر" className="mb-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-300">
        <Link href="/" className="hover:text-ink-700">خانه</Link>
        <span>/</span>
        <span className="text-ink-500">سبد خرید</span>
      </nav>

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-h1 text-ink-900">
          سبد خرید
          <span className="ms-2 text-[0.8125rem] font-normal text-ink-400">({num(totals.itemCount)} قلم)</span>
        </h1>
        <Link href="/shop" className="group inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 transition-colors hover:text-sage-700">
          ادامهٔ خرید
          <ArrowLeft className="size-3.5 transition-transform duration-400 group-hover:-translate-x-1" strokeWidth={2} />
        </Link>
      </div>

      {/* free shipping meter */}
      <div className="mt-4 rounded-xl border border-line-soft bg-cream-100/70 p-3.5">
        <div className="flex items-center gap-2 text-[0.75rem]">
          <Truck className="size-4 shrink-0 text-sage-600" strokeWidth={1.7} />
          {totals.freeShippingGap > 0 ? (
            <p className="text-ink-600">
              <span className="font-medium text-sage-700">{toman(totals.freeShippingGap)}</span> تا ارسال رایگان
            </p>
          ) : (
            <p className="font-medium text-sage-700">ارسال این سفارش رایگان است ✦</p>
          )}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream-300">
          <motion.div
            className="h-full rounded-full bg-sage-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line-soft bg-white">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.key}
                layout
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 p-3.5 sm:gap-4 sm:p-4">
                  <Link href={`/product/${item.slug}`} className="relative size-[86px] shrink-0 overflow-hidden rounded-lg bg-cream-200 sm:size-28">
                    <Image src={item.image} alt={item.name} fill sizes="(max-width:640px) 86px, 112px" className="object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${item.slug}`} className="line-clamp-2 text-[0.8125rem] font-medium leading-[1.6] text-ink-900 sm:text-sm">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => remove(item.key)}
                        aria-label={`حذف ${item.name}`}
                        className="-me-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-blush-100 hover:text-blush-500"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2.5 rounded-full border border-white/70" style={{ backgroundImage: colorOf(item.color).swatch }} />
                        {item.colorName}
                      </span>
                      <span className="text-cream-400">•</span>
                      <span>سایز {sizeLabel(item.size)}</span>
                    </div>

                    {item.maxStock <= 5 && (
                      <p className="mt-1 text-[0.625rem] text-blush-500">تنها {num(item.maxStock)} عدد در انبار</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <QuantityStepper value={item.qty} onChange={(v) => setQty(item.key, v)} max={item.maxStock} size="sm" />
                      <div className="text-end">
                        <p className="text-[0.875rem] font-semibold text-ink-900">{money(item.price * item.qty)}</p>
                        {item.qty > 1 && (
                          <p className="text-[0.625rem] text-ink-300">هر عدد {money(item.price)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="lg:sticky lg:top-24">
          <OrderSummary items={items} coupon={coupon} onCoupon={setCoupon} />
          <ButtonLink
            href="/checkout"
            variant="primary"
            size="lg"
            full
            className={cn('mt-3', !coupon && '')}
          >
            <Lock className="size-4" strokeWidth={1.8} />
            ادامهٔ فرایند خرید
          </ButtonLink>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[0.625rem] text-ink-300">
            <Lock className="size-3" strokeWidth={1.8} />
            پرداخت امن از طریق درگاه بانکی · اطلاعات شما محفوظ است
          </p>
        </div>
      </div>
    </div>
  );
}
