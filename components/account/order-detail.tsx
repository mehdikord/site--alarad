'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Check, CircleDot, Copy, ExternalLink, MapPin, Package, Truck, X } from 'lucide-react';
import { api, useUi } from '@/lib/store';
import { ORDER_STATUS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS, SHIPMENT_STATUS, GATEWAY_LABEL } from '@/lib/order-meta';
import { date, dateTime, num, toman } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrderStatus, OrderView } from '@/lib/types';

const TIMELINE: { key: OrderStatus; label: string; caption: string }[] = [
  { key: 'pending', label: 'ثبت سفارش', caption: 'ثبت و پرداخت' },
  { key: 'processing', label: 'آماده‌سازی', caption: 'بسته‌بندی در انبار' },
  { key: 'shipped', label: 'ارسال', caption: 'تحویل به پست' },
  { key: 'delivered', label: 'تحویل', caption: 'رسیدن به دست شما' },
];

export function OrderDetail({ order }: { order: OrderView }) {
  const notify = useUi((s) => s.notify);
  const router = useRouter();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'pay' | 'cancel' | null>(null);

  const meta = ORDER_STATUS[order.status];
  const ended = order.status === 'cancelled' || order.status === 'returned';
  const activeIndex = TIMELINE.findIndex((t) => t.key === order.status);
  const shipment = order.shipments.find((s) => s.trackingCode) ?? order.shipments[0];

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopied(text);
    notify(`${label} کپی شد.`, 'success');
    setTimeout(() => setCopied(null), 1800);
  };

  const pay = async () => {
    setBusy('pay');
    const res = await api<{ redirectUrl?: string }>(`/api/orders/${encodeURIComponent(order.code)}/pay`, {});
    if (res.ok && res.redirectUrl) {
      window.location.href = res.redirectUrl;
      return;
    }
    setBusy(null);
    notify(res.message ?? 'اتصال به درگاه ناموفق بود.', 'error');
  };

  const cancel = async () => {
    if (!window.confirm('این سفارش لغو شود؟')) return;
    setBusy('cancel');
    const res = await api(`/api/orders/${encodeURIComponent(order.code)}/cancel`, {});
    setBusy(null);
    notify(res.message ?? (res.ok ? 'سفارش لغو شد.' : 'لغو ناموفق بود.'), res.ok ? 'success' : 'error');
    router.refresh();
  };

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
            <button
              onClick={() => copy(order.code, 'شمارهٔ سفارش')}
              aria-label="کپی"
              className="flex size-7 items-center justify-center rounded-full bg-cream-200 text-ink-500 transition-colors hover:text-sage-700"
            >
              {copied === order.code ? <Check className="size-3.5 text-sage-600" strokeWidth={2.6} /> : <Copy className="size-3.5" strokeWidth={1.8} />}
            </button>
          </div>
          <p className="mt-1 text-[0.6875rem] text-ink-400">ثبت شده در {date(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-3 py-1 text-[0.6875rem] font-medium', PAYMENT_STATUS[order.paymentStatus].tone)}>
            {PAYMENT_STATUS[order.paymentStatus].label}
          </span>
          <span className={cn('rounded-full px-3 py-1 text-[0.6875rem] font-medium', meta.tone)}>{meta.label}</span>
        </div>
      </div>

      {(order.canPay || order.canCancel) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blush-300/70 bg-blush-100/60 p-4">
          <p className="text-[0.75rem] leading-relaxed text-ink-700">
            این سفارش هنوز پرداخت نشده است. برای ارسال، پرداخت را تکمیل کنید؛ سفارش‌های پرداخت‌نشده پس از مدتی خودکار لغو می‌شوند.
          </p>
          <div className="flex gap-2">
            {order.canPay && (
              <Button size="md" onClick={pay} loading={busy === 'pay'}>
                پرداخت {toman(order.totals.total)}
              </Button>
            )}
            {order.canCancel && (
              <Button size="md" variant="outline" onClick={cancel} loading={busy === 'cancel'}>
                لغو سفارش
              </Button>
            )}
          </div>
        </div>
      )}

      {/* tracking timeline */}
      <div className="mt-5 rounded-xl border border-line-soft bg-white p-4 sm:p-6">
        {ended ? (
          <div className="flex items-center gap-2 text-[0.8125rem] text-blush-500">
            <X className="size-4" strokeWidth={2} />
            {order.status === 'cancelled' ? 'این سفارش لغو شده است.' : 'این سفارش مرجوع شده است.'}
          </div>
        ) : (
          <ol className="relative grid grid-cols-4 gap-1">
            <span className="absolute inset-x-[12.5%] top-[13px] h-[2px] rounded-full bg-cream-200" aria-hidden />
            <motion.span
              className="absolute start-[12.5%] top-[13px] h-[2px] rounded-full bg-sage-400"
              initial={{ width: 0 }}
              animate={{ width: `${(Math.max(activeIndex, 0) / 3) * 75}%` }}
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
                  <span className={cn('mt-2 text-[0.6875rem]', isCurrent ? 'font-medium text-ink-900' : done ? 'text-ink-600' : 'text-ink-300')}>{t.label}</span>
                  <span className="mt-0.5 hidden text-[0.5625rem] text-ink-300 sm:block">{t.caption}</span>
                </li>
              );
            })}
          </ol>
        )}

        {shipment && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sage-200 bg-sage-50/70 p-3">
            <div className="flex items-start gap-2 text-[0.75rem]">
              <Truck className="mt-0.5 size-4 shrink-0 text-sage-700" strokeWidth={1.8} />
              <div>
                <p className="font-medium text-ink-900">
                  {shipment.carrier ?? order.shipping.title}
                  <span className={cn('ms-2 rounded-full px-2 py-0.5 text-[0.625rem]', SHIPMENT_STATUS[shipment.status].tone)}>
                    {SHIPMENT_STATUS[shipment.status].label}
                  </span>
                </p>
                {shipment.trackingCode ? (
                  <p className="mt-1 text-ink-600">
                    کد رهگیری مرسوله: <span className="font-mono font-medium text-ink-900" dir="ltr">{shipment.trackingCode}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-ink-400">کد رهگیری پس از تحویل به حمل‌کننده ثبت می‌شود.</p>
                )}
                {shipment.shippedAt && <p className="mt-0.5 text-[0.625rem] text-ink-400">ارسال: {dateTime(shipment.shippedAt)}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {shipment.trackingCode && (
                <button
                  onClick={() => copy(shipment.trackingCode!, 'کد رهگیری')}
                  className="flex items-center gap-1.5 rounded-full border border-sage-300 bg-white px-3 py-1.5 text-[0.6875rem] text-sage-700"
                >
                  <Copy className="size-3" strokeWidth={2} />
                  کپی کد
                </button>
              )}
              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-[0.6875rem] text-cream-50"
                >
                  <ExternalLink className="size-3" strokeWidth={2} />
                  رهگیری در سایت حمل‌کننده
                </a>
              )}
            </div>
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
          <ul className="mt-3 divide-y divide-line-soft">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2.5">
                <Link href={i.productSlug ? `/product/${i.productSlug}` : '#'} className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-200">
                  {i.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt={i.name} className="size-full object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[0.75rem] font-medium text-ink-900">{i.name}</p>
                  <p className="text-[0.625rem] text-ink-400">
                    {[i.colorName, i.sizeLabel].filter(Boolean).join(' · ')} × {num(i.quantity)}
                  </p>
                </div>
                <p className="shrink-0 text-[0.75rem] text-ink-800">{toman(i.total)}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* summary + address */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line-soft bg-white p-4">
            <h2 className="text-[0.875rem] font-semibold text-ink-900">خلاصهٔ پرداخت</h2>
            <div className="mt-2.5 space-y-1.5 text-[0.75rem]">
              <Row label="جمع کالاها" value={toman(order.totals.subtotal)} />
              {order.totals.discount > 0 && <Row label={`تخفیف${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`− ${toman(order.totals.discount)}`} sage />}
              <Row label="ارسال" value={order.totals.shipping === 0 ? 'رایگان' : toman(order.totals.shipping)} sage={order.totals.shipping === 0} />
              {order.totals.tax > 0 && <Row label="مالیات" value={toman(order.totals.tax)} />}
              <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-[0.8125rem]">
                <span className="text-ink-600">{order.paymentStatus === 'paid' ? 'پرداخت‌شده' : 'مبلغ سفارش'}</span>
                <span className="font-semibold text-ink-900">{toman(order.totals.total)}</span>
              </div>
            </div>
            <p className="mt-2 text-[0.625rem] leading-relaxed text-ink-300">
              {PAYMENT_METHOD_LABEL[order.paymentMethod]}
              {order.payment && (
                <>
                  {' '}· {GATEWAY_LABEL[order.payment.gateway] ?? order.payment.gateway}
                  {order.payment.cardPan && (
                    <>
                      {' '}· <span dir="ltr">{order.payment.cardPan}</span>
                    </>
                  )}
                  {order.payment.refId && (
                    <>
                      <br />
                      کد پیگیری بانکی: <span dir="ltr">{order.payment.refId}</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-line-soft bg-white p-4">
            <h2 className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink-900">
              <MapPin className="size-4 text-sage-600" strokeWidth={1.8} />
              نشانی تحویل
            </h2>
            <p className="mt-2 text-[0.75rem] leading-[1.9] text-ink-500">
              {order.receiver.name} — <span dir="ltr">{order.receiver.phone}</span>
              <br />
              {order.receiver.province}، {order.receiver.city}، {order.receiver.address}
              {order.receiver.unit ? `، ${order.receiver.unit}` : ''}
              <br />
              کد پستی {order.receiver.postalCode}
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
            <li key={`${t.status}-${t.at}-${i}`} className="flex gap-3">
              <span className="relative mt-1.5 flex size-2 shrink-0">
                <span className={cn('size-2 rounded-full', i === 0 ? 'bg-sage-500' : 'bg-cream-300')} />
              </span>
              <div className="pb-1">
                <p className="text-[0.75rem] text-ink-800">{t.note || ORDER_STATUS[t.status].label}</p>
                <p className="text-[0.625rem] text-ink-300">
                  {ORDER_STATUS[t.status].label} · {dateTime(t.at)}
                </p>
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
