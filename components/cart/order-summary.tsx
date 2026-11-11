'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Tag, X } from 'lucide-react';
import type { CartItem, CartTotals } from '@/lib/types';
import { computeTotals } from '@/lib/pricing';
import { applyCoupon, type CouponResult } from '@/lib/pricing';
import { money, num, toman } from '@/lib/format';
import { cn } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD, sizeLabel } from '@/lib/data/taxonomy';

export function CouponField({
  subtotal,
  coupon,
  onApply,
  onClear,
}: {
  subtotal: number;
  coupon: { code: string; amount: number; label?: string } | null;
  onApply: (r: CouponResult) => void;
  onClear: () => void;
}) {
  const [code, setCode] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'error' | 'ok'>('idle');
  const [message, setMessage] = React.useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = applyCoupon(code, subtotal);
    if (result.ok) {
      onApply(result);
      setState('ok');
      setMessage(result.message);
    } else {
      setState('error');
      setMessage(result.message);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-sage-200 bg-sage-50 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Check className="size-3.5 text-sage-600" strokeWidth={2.6} />
          <div>
            <p className="text-[0.75rem] font-medium text-sage-700">کد «{coupon.code}» اعمال شد</p>
            <p className="text-[0.625rem] text-ink-500">{toman(coupon.amount)} تخفیف</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onClear();
            setState('idle');
            setCode('');
          }}
          aria-label="حذف کد تخفیف"
          className="flex size-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-white hover:text-ink-900"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" strokeWidth={1.7} />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setState('idle');
            }}
            placeholder="کد تخفیف"
            aria-label="کد تخفیف"
            className={cn(
              'h-11 w-full rounded-xl border bg-white ps-9 pe-3 text-[0.75rem] uppercase tracking-wide outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-300',
              state === 'error' ? 'border-blush-300' : 'border-line focus:border-sage-400',
            )}
          />
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-cream-200 px-4 text-[0.75rem] font-medium text-ink-800 transition-colors hover:bg-cream-300"
        >
          اعمال
        </button>
      </div>
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn('mt-1.5 ps-1 text-[0.6875rem]', state === 'error' ? 'text-blush-500' : 'text-sage-700')}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
      {state === 'idle' && (
        <p className="mt-1.5 ps-1 text-[0.625rem] text-ink-300">
          کدهای فعال: <span className="text-ink-400">ALARAD10</span> · <span className="text-ink-400">WELCOME15</span>
        </p>
      )}
    </form>
  );
}

export function OrderSummary({
  items,
  shippingCost = 0,
  shippingTitle,
  coupon,
  onCoupon,
  footer,
  showItems = false,
  compact = false,
  showCoupon = true,
}: {
  items: CartItem[];
  shippingCost?: number;
  shippingTitle?: string;
  coupon: { code: string; amount: number; label?: string } | null;
  onCoupon: (c: { code: string; amount: number; label?: string } | null) => void;
  footer?: React.ReactNode;
  showItems?: boolean;
  compact?: boolean;
  showCoupon?: boolean;
}) {
  const base = computeTotals(items);
  const discount = coupon?.amount ?? 0;
  const taxable = Math.max(base.subtotal - discount, 0);
  const tax = Math.round(taxable * 0.09);
  const total = Math.max(taxable + tax + shippingCost, 0);

  return (
    <div className={cn('rounded-xl border border-line-soft bg-white', compact ? 'p-4' : 'p-5 sm:p-6')}>
      <h2 className="text-[0.9375rem] font-semibold text-ink-900">خلاصهٔ سفارش</h2>

      {showItems && (
        <ul className="mt-4 max-h-[15rem] space-y-2.5 overflow-y-auto border-b border-line-soft pb-4">
          {items.map((i) => (
            <li key={i.key} className="flex items-center justify-between gap-2 text-[0.75rem]">
              <span className="min-w-0">
                <span className="line-clamp-1 text-ink-700">{i.name}</span>
                <span className="text-[0.625rem] text-ink-300">
                  {i.colorName} · {sizeLabel(i.size)} × {num(i.qty)}
                </span>
              </span>
              <span className="shrink-0 font-medium text-ink-800">{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2.5 text-[0.8125rem]">
        <Row label={`جمع کالاها (${num(base.itemCount)} قلم)`} value={toman(base.subtotal)} />
        {discount > 0 && <Row label={`تخفیف (${coupon?.code})`} value={`− ${toman(discount)}`} tone="sage" />}
        <Row
          label={shippingTitle ? `ارسال — ${shippingTitle}` : 'هزینهٔ ارسال'}
          value={shippingCost === 0 ? 'رایگان' : toman(shippingCost)}
          tone={shippingCost === 0 ? 'sage' : undefined}
        />
        <Row label="مالیات بر ارزش افزوده (۹٪)" value={toman(tax)} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3.5">
        <span className="text-[0.8125rem] text-ink-600">مبلغ قابل پرداخت</span>
        <span className="text-[1.0625rem] font-semibold text-ink-900">{toman(total)}</span>
      </div>

      {showCoupon && (
        <div className={cn('mt-4 border-t border-line-soft pt-4', compact && 'pt-3.5')}>
          <CouponField
            subtotal={base.subtotal}
            coupon={coupon}
            onApply={(r) => r.code && onCoupon({ code: r.code, amount: r.amount, label: r.label })}
            onClear={() => onCoupon(null)}
          />
        </div>
      )}

      {base.freeShippingGap > 0 && shippingCost > 0 && (
        <p className="mt-3 rounded-lg bg-cream-100 px-3 py-2 text-[0.6875rem] leading-relaxed text-ink-500">
          با {toman(base.freeShippingGap)} خرید بیشتر، ارسال رایگان می‌شود (آستانهٔ {toman(FREE_SHIPPING_THRESHOLD)}).
        </p>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'sage' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-500">{label}</span>
      <span className={cn('font-medium', tone === 'sage' ? 'text-sage-700' : 'text-ink-900')}>{value}</span>
    </div>
  );
}
