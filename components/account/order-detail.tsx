'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, CircleDot, Copy, MapPin, Package, Truck, X } from 'lucide-react';
import { useOrders, useHydrated, useUi } from '@/lib/store';
import { STATUS_META } from '@/lib/store/orders';
import { sizeLabel } from '@/lib/data/taxonomy';
import { date, dateTime, num, toman } from '@/lib/format';
import { EmptyState } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const TIMELINE: { key: OrderStatus | 'placed'; label: string; caption: string }[] = [
  { key: 'placed', label: 'ثبت سفارش', caption: 'پرداخت تأیید شد' },
  { key: 'processing', label: 'آماده‌سازی', caption: 'بسته‌بندی در انبار' },
  { key: 'shipped', label: 'ارسال', caption: 'تحویل به پست' },
  { key: 'delivered', label: 'تحویل', caption: 'رسیدن به دست شما' },
];

export function OrderDetail({ code }: { code: string }) {
  const hydrated = useHydrated();
  const order = useOrders((s) => s.orders.find((o) => o.code === code));
  const advance = useOrders((s) => s.advance);
  const notify = useUi((s) => s.notify);
  const [copied, setCopied] = React.useState(false);

  if (!hydrated) {
    return (
      <div className="container-x py-10">
        <div className="skeleton h-8 w-56 rounded-full" />
        <div className="mt-5 skeleton h-72 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-x">
        <EmptyState
          variant="box"
          title="این سفارش پیدا نشد"
          description="کد رهگیری را بررسی کنید یا از فهرست سفارش‌ها یک مورد را انتخاب کنید."
          action={<ButtonLink href="/account" variant="primary" size="md">بازگشت به حساب</ButtonLink>}
        />
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const currentIndex =
    order.status === 'cancelled'
      ? -1
      : TIMELINE.findIndex((t) => t.key === order.status);
  const activeIndex = order.status === 'pending' ? 0 : currentIndex;

  const copy = async () => {
    await navigator.clipboard.writeText(order.code).catch(() => null);
    setCopied(true);
    notify('کد رهگیری کپی شد.', 'success');
    setTimeout(() => setCopied(false), 1800);
  };

  const next = order.status === 'processing' ? 'shipped' : order.status === 'shipped' ? 'delivered' : null;

  return (
    <div className="container-x pt-5 sm:pt-8">
      <Link href="/account" className="group inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 transition-colors hover:text-sage-700">
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        بازگشت به سفارش‌ها
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">پیگیری سفارش</p>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-[1.25rem] font-semibold text-ink-900" dir="ltr">
              {order.code}
            </h1>
            <button onClick={copy} aria-label="کپی" className="flex size-7 items-center justify-center rounded-full bg-cream-200 text-ink-500 transition-colors hover:text-sage-700">
              {copied ? <Check className="size-3.5 text-sage-600" strokeWidth={2.6} /> : <Copy className="size-3.5" strokeWidth={1.8} />}
            </button>
          </div>
          <p className="mt-1 text-[0.6875rem] text-ink-400">ثبت شده در {date(order.createdAt)}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-[0.6875rem] font-medium', meta.tone)}>{meta.label}</span>
      </div>

      {/* tracking timeline */}
      <div className="mt-5 rounded-xl border border-line-soft bg-white p-4 sm:p-6">
        {order.status === 'cancelled' ? (
          <div className="flex items-center gap-2 text-[0.8125rem] text-blush-500">
            <X className="size-4" strokeWidth={2} />
            این سفارش لغو شده است.
          </div>
        ) : (
          <ol className="relative grid grid-cols-4 gap-1">
            {/* progress rail */}
            <span className="absolute inset-x-[12.5%] top-[13px] h-[2px] rounded-full bg-cream-200" aria-hidden />
            <motion.span
              className="absolute start-[12.5%] top-[13px] h-[2px] rounded-full bg-sage-400"
              initial={{ width: 0 }}
              animate={{ width: `${(activeIndex / 3) * 75}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden
            />
            {TIMELINE.map((t, i) => {
              const done = i <= activeIndex;
              const isCurrent = i === activeIndex;
              return (
                <li key={t.key} className="relative flex flex-col items-center text-center">
                  <span
                    className={cn(
                      'z-10 flex size-7 items-center justify-center rounded-full border-2 transition-colors duration-500',
                      done ? 'border-sage-500 bg-sage-500 text-white' : 'border-cream-300 bg-white text-cream-400',
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : <CircleDot className="size-3" strokeWidth={2} />}
                  </span>
                  <span className={cn('mt-2 text-[0.6875rem]', isCurrent ? 'font-medium text-ink-900' : done ? 'text-ink-600' : 'text-ink-300')}>
                    {t.label}
                  </span>
                  <span className="mt-0.5 hidden text-[0.5625rem] text-ink-300 sm:block">{t.caption}</span>
                </li>
              );
            })}
          </ol>
        )}

        {next && (
          <div className="mt-5 rounded-lg border border-dashed border-line bg-cream-50 p-3">
            <p className="text-[0.625rem] text-ink-400">دمو: شبیه‌سازی مرحلهٔ بعدی</p>
            <button
              onClick={() => {
                advance(order.code, next);
                notify('وضعیت سفارش به‌روزرسانی شد.');
              }}
              className="mt-1.5 text-[0.75rem] text-sage-700 underline decoration-sage-300 underline-offset-4"
            >
              {next === 'shipped' ? 'علامت‌گذاری به‌عنوان ارسال‌شده' : 'علامت‌گذاری به‌عنوان تحویل‌شده'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* items */}
        <div className="rounded-xl border border-line-soft bg-white p-4">
          <h2 className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-900">
            <Package className="size-4 text-sage-600" strokeWidth={1.8} />
            اقلام سفارش
          </h2>
          {order.items.length ? (
            <ul className="mt-3 divide-y divide-line-soft">
              {order.items.map((i) => (
                <li key={i.key} className="flex items-center gap-3 py-2.5">
                  <Link href={`/product/${i.slug}`} className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt={i.name} className="size-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[0.75rem] font-medium text-ink-900">{i.name}</p>
                    <p className="text-[0.625rem] text-ink-400">
                      {i.colorName} · {sizeLabel(i.size)} × {num(i.qty)}
                    </p>
                  </div>
                  <p className="shrink-0 text-[0.75rem] text-ink-800">{num(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-3 space-y-2.5">
              <li className="flex items-center gap-3">
                <span className="size-14 shrink-0 rounded-md bg-cream-200" />
                <div className="flex-1">
                  <div className="h-2.5 w-2/3 rounded-full bg-cream-200" />
                  <div className="mt-2 h-2 w-1/3 rounded-full bg-cream-200" />
                </div>
              </li>
              <p className="pt-1 text-[0.6875rem] text-ink-300">
                جزئیات اقلام این سفارش آرشیو شده است؛ مبلغ کل در خلاصهٔ پرداخت آمده است.
              </p>
            </ul>
          )}
        </div>

        {/* summary + address */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line-soft bg-white p-4">
            <h2 className="text-[0.875rem] font-semibold text-ink-900">خلاصهٔ پرداخت</h2>
            <div className="mt-2.5 space-y-1.5 text-[0.75rem]">
              <Row label="جمع کالاها" value={toman(order.totals.subtotal)} />
              {order.totals.discount > 0 && <Row label="تخفیف" value={`− ${toman(order.totals.discount)}`} sage />}
              <Row label="ارسال" value={order.totals.shipping === 0 ? 'رایگان' : toman(order.totals.shipping)} sage={order.totals.shipping === 0} />
              <Row label="مالیات" value={toman(order.totals.tax)} />
              <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-[0.8125rem]">
                <span className="text-ink-600">پرداخت‌شده</span>
                <span className="font-semibold text-ink-900">{toman(order.totals.grandTotal)}</span>
              </div>
            </div>
            <p className="mt-2 text-[0.625rem] text-ink-300">
              {order.payment.method} · {order.payment.maskedCard}
              <br />
              کد پیگیری بانکی: <span dir="ltr">{order.payment.ref}</span>
            </p>
          </div>

          <div className="rounded-xl border border-line-soft bg-white p-4">
            <h2 className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-900">
              <MapPin className="size-4 text-sage-600" strokeWidth={1.8} />
              نشانی تحویل
            </h2>
            <p className="mt-2 text-[0.75rem] leading-[1.9] text-ink-500">
              {order.address.fullName}
              <br />
              {order.address.province}، {order.address.city}، {order.address.line1}
              <br />
              کد پستی {order.address.postalCode}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
              <Truck className="size-3.5" strokeWidth={1.7} />
              {order.shipping.title} — {order.shipping.eta}
            </p>
          </div>
        </div>
      </div>

      {/* timeline log */}
      <div className="mt-4 rounded-xl border border-line-soft bg-white p-4">
        <h2 className="text-[0.875rem] font-semibold text-ink-900">تاریخچهٔ وضعیت</h2>
        <ul className="mt-3 space-y-3">
          {[...order.timeline].reverse().map((t, i) => (
            <li key={`${t.status}-${i}`} className="flex gap-3">
              <span className="relative mt-1.5 flex size-2 shrink-0">
                <span className={cn('size-2 rounded-full', i === 0 ? 'bg-sage-500' : 'bg-cream-300')} />
                {i < order.timeline.length - 1 && <span className="absolute start-[3px] top-2 h-full w-px bg-cream-200" />}
              </span>
              <div className="pb-1">
                <p className="text-[0.75rem] text-ink-800">{t.note ?? STATUS_META[t.status as OrderStatus]?.label ?? t.status}</p>
                <p className="text-[0.625rem] text-ink-300">{dateTime(t.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, sage }: { label: string; value: string; sage?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={cn('font-medium', sage ? 'text-sage-700' : 'text-ink-900')}>{value}</span>
    </div>
  );
}
