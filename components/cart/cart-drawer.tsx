'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart, useHydrated } from '@/lib/store';
import { computeTotals, freeShippingProgress } from '@/lib/pricing';
import { money, num, toman } from '@/lib/format';
import { colorOf, sizeLabel, FREE_SHIPPING_THRESHOLD } from '@/lib/data/taxonomy';
import { Sheet, QuantityStepper, EmptyState } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, close, remove, setQty } = useCart();
  const hydrated = useHydrated();
  const totals = computeTotals(items);
  const progress = freeShippingProgress(totals.subtotal);

  return (
    <Sheet
      open={hydrated && isOpen}
      onClose={close}
      side="end"
      title={`سبد خرید${hydrated && totals.itemCount ? ` (${num(totals.itemCount)})` : ''}`}
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">جمع سبد</span>
              <span className="font-semibold text-ink-900">{toman(totals.subtotal)}</span>
            </div>
            <p className="text-[0.6875rem] leading-relaxed text-ink-400">
              مالیات و هزینهٔ ارسال در مرحلهٔ پرداخت محاسبه می‌شود.
            </p>
            <div className="flex flex-col gap-2">
              <ButtonLink href="/checkout" variant="primary" size="lg" full onClick={close}>
                تکمیل خرید
              </ButtonLink>
              <ButtonLink href="/cart" variant="outline" size="md" full onClick={close}>
                مشاهدهٔ سبد خرید
              </ButtonLink>
            </div>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState
          variant="bag"
          title="سبد خرید شما خالی است"
          description="کالاهای آرام و نرم ما در انتظار شماست؛ از تازه‌ترین‌ها شروع کنید."
          action={
            <ButtonLink href="/shop" variant="primary" size="md" onClick={close}>
              مشاهدهٔ محصولات
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col">
          {/* free shipping meter */}
          <div className="border-b border-line-soft bg-cream-200/50 px-5 py-3.5">
            {totals.freeShippingGap > 0 ? (
              <p className="text-[0.6875rem] text-ink-600">
                <span className="font-medium text-sage-700">{toman(totals.freeShippingGap)}</span> تا ارسال رایگان
              </p>
            ) : (
              <p className="text-[0.6875rem] font-medium text-sage-700">ارسال این سفارش رایگان است ✦</p>
            )}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream-300">
              <motion.div
                className={cn('h-full rounded-full', progress >= 100 ? 'bg-sage-500' : 'bg-sage-400')}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <ul className="divide-y divide-line-soft">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 px-4 py-4">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={close}
                      className="relative size-20 shrink-0 overflow-hidden rounded-md bg-cream-200"
                    >
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link href={`/product/${item.slug}`} onClick={close} className="line-clamp-2 text-[0.8125rem] font-medium leading-[1.6] text-ink-900">
                        {item.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-[0.6875rem] text-ink-400">
                        <span className="inline-flex items-center gap-1">
                          <span className="size-2.5 rounded-full border border-white/70" style={{ backgroundImage: colorOf(item.color).swatch }} />
                          {item.colorName}
                        </span>
                        <span className="text-cream-400">•</span>
                        <span>سایز {sizeLabel(item.size)}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <QuantityStepper value={item.qty} onChange={(v) => setQty(item.key, v)} max={item.maxStock} size="sm" />
                        <span className="text-[0.8125rem] font-semibold text-ink-900">{money(item.price * item.qty)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(item.key)}
                      aria-label={`حذف ${item.name}`}
                      className="flex size-8 shrink-0 items-center justify-center self-start rounded-full text-ink-300 transition-colors hover:bg-blush-100 hover:text-blush-500"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.8} />
                    </button>
                  </div>
                  {item.maxStock <= 5 && (
                    <p className="px-4 pb-3 -mt-2 text-[0.625rem] text-blush-500">
                      تنها {num(item.maxStock)} عدد در انبار — پیش از پایان موجودی ثبت کنید.
                    </p>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-2 flex items-center justify-center gap-2 border-t border-line-soft py-3 text-[0.6875rem] text-ink-400">
            <ShoppingBag className="size-3.5" strokeWidth={1.6} />
            ارسال رایگان برای خرید بالای {toman(FREE_SHIPPING_THRESHOLD)}
          </div>
        </div>
      )}
    </Sheet>
  );
}
