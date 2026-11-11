'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Clock, Copy, MapPin, Package, Truck } from 'lucide-react';
import { useOrders, useHydrated } from '@/lib/store';
import { toman, num, date } from '@/lib/format';
import { ButtonLink } from '@/components/ui/button';
import { useUi } from '@/lib/store';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export function SuccessView({ code }: { code: string }) {
  const hydrated = useHydrated();
  const order = useOrders((s) => s.orders.find((o) => o.code === code));
  const notify = useUi((s) => s.notify);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      notify('کد رهگیری کپی شد.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('کپی نشد؛ لطفاً دستی یادداشت کنید.', 'error');
    }
  };

  return (
    <div className="container-x max-w-2xl py-10 sm:py-14">
      <div className="text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-sage-100 text-sage-600"
        >
          <Check className="size-8" strokeWidth={2.2} />
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="mt-5 text-h1 text-ink-900"
        >
          سفارش شما با موفقیت ثبت شد
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mt-2 text-[0.8125rem] leading-[1.9] text-ink-500"
        >
          پیامک تأیید برای شما ارسال شد. سفارش شما در حال آماده‌سازی است و پس از تحویل به پست، کد رهگیری در حساب کاربری‌تان فعال می‌شود.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
          className="mx-auto mt-6 inline-flex items-center gap-3 rounded-xl border border-sage-200 bg-sage-50/80 px-4 py-3"
        >
          <div className="text-start">
            <p className="text-[0.625rem] text-ink-500">کد رهگیری سفارش</p>
            <p className="font-mono text-[0.9375rem] font-semibold tracking-wide text-ink-900" dir="ltr">
              {code}
            </p>
          </div>
          <button
            onClick={copy}
            aria-label="کپی کد رهگیری"
            className="flex size-8 items-center justify-center rounded-full bg-white text-ink-500 transition-colors hover:text-sage-700"
          >
            {copied ? <Check className="size-3.5 text-sage-600" strokeWidth={2.6} /> : <Copy className="size-3.5" strokeWidth={1.8} />}
          </button>
        </motion.div>
      </div>

      {hydrated && order && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
          className="mt-8 rounded-xl border border-line-soft bg-white p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-900">
                <MapPin className="size-3.5 text-sage-600" strokeWidth={1.8} />
                ارسال به
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-[1.9] text-ink-500">
                {order.address.fullName}
                <br />
                {order.address.province}، {order.address.city}، {order.address.line1}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-900">
                <Truck className="size-3.5 text-sage-600" strokeWidth={1.8} />
                روش ارسال
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-[1.9] text-ink-500">
                {order.shipping.title}
                <br />
                {order.shipping.eta}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-900">
                <Package className="size-3.5 text-sage-600" strokeWidth={1.8} />
                مبلغ پرداخت‌شده
              </p>
              <p className="mt-1.5 text-[0.75rem] text-ink-500">{toman(order.totals.grandTotal)} ({num(order.totals.itemCount)} قلم)</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink-900">
                <Clock className="size-3.5 text-sage-600" strokeWidth={1.8} />
                تاریخ ثبت
              </p>
              <p className="mt-1.5 text-[0.75rem] text-ink-500">{date(order.createdAt)}</p>
            </div>
          </div>

          {order.items.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-line-soft pt-4">
              {order.items.map((i) => (
                <li key={i.key} className="flex items-center justify-between gap-2 text-[0.75rem]">
                  <span className="min-w-0 text-ink-600">
                    {i.name} <span className="text-[0.625rem] text-ink-300">· {i.colorName} · {i.sizeLabel}</span>
                  </span>
                  <span className="shrink-0 text-ink-800">{num(i.qty)} عدد</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-cream-100 px-3 py-2.5 text-[0.6875rem] text-ink-500">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-sage-500" />
            </span>
            وضعیت فعلی: در حال آماده‌سازی در انبار
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <ButtonLink href={`/account/orders/${code}`} variant="primary" size="md">
          پیگیری سفارش
        </ButtonLink>
        <ButtonLink href="/shop" variant="outline" size="md">
          ادامهٔ خرید
        </ButtonLink>
      </div>

      <p className={cn('mt-8 text-center text-[0.6875rem] leading-[1.9] text-ink-400')}>
        سؤالی دارید؟ در صفحهٔ{' '}
        <Link href="/help" className="text-sage-700 underline decoration-sage-300 underline-offset-4">
          راهنما
        </Link>{' '}
        پاسخ بیشتر سؤال‌ها آمده است.
      </p>
    </div>
  );
}
