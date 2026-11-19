'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock } from 'lucide-react';
import type { OrderView } from '@/lib/types';
import { api, useUi } from '@/lib/store';
import { toman } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';

export function PaymentResult({ order, message }: { order: OrderView; message: string | null }) {
  const notify = useUi((s) => s.notify);
  const router = useRouter();
  const [busy, setBusy] = React.useState<'pay' | 'cancel' | null>(null);
  const cancelled = order.status === 'cancelled';

  const retry = async () => {
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
    if (!window.confirm('سفارش لغو شود؟')) return;
    setBusy('cancel');
    const res = await api(`/api/orders/${encodeURIComponent(order.code)}/cancel`, {});
    setBusy(null);
    notify(res.message ?? (res.ok ? 'سفارش لغو شد.' : 'لغو سفارش ناموفق بود.'), res.ok ? 'success' : 'error');
    router.refresh();
  };

  return (
    <div className="container-x max-w-xl py-10 text-center sm:py-14">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-blush-100 text-blush-500">
        {cancelled ? <AlertCircle className="size-8" strokeWidth={2} /> : <Clock className="size-8" strokeWidth={2} />}
      </span>
      <h1 className="mt-5 text-h1 text-ink-900">{cancelled ? 'این سفارش لغو شده است' : 'پرداخت تکمیل نشد'}</h1>
      <p className="mt-2 text-[0.8125rem] leading-[1.9] text-ink-500">
        {cancelled
          ? 'کالاهای این سفارش به انبار بازگشت. می‌توانید دوباره از فروشگاه خرید کنید.'
          : message ?? 'سفارش شما ثبت شده اما هنوز پرداخت نشده است. اگر مبلغی از حساب شما کسر شده، حداکثر تا ۷۲ ساعت به حساب‌تان بازمی‌گردد.'}
      </p>

      <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-xl border border-line-soft bg-white px-5 py-3">
        <span className="text-[0.625rem] text-ink-400">شمارهٔ سفارش</span>
        <span className="font-mono text-[0.9375rem] font-semibold text-ink-900" dir="ltr">
          {order.code}
        </span>
        <span className="mt-1 text-[0.75rem] text-ink-500">{toman(order.totals.total)}</span>
      </div>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {order.canPay && (
          <Button onClick={retry} loading={busy === 'pay'} size="lg">
            پرداخت دوباره
          </Button>
        )}
        {order.canCancel && (
          <Button onClick={cancel} loading={busy === 'cancel'} variant="outline" size="lg">
            لغو سفارش
          </Button>
        )}
        {!order.canPay && (
          <ButtonLink href="/shop" variant="primary" size="lg">
            ادامهٔ خرید
          </ButtonLink>
        )}
      </div>
      <p className="mt-6 text-[0.6875rem] text-ink-400">
        <Link href={`/account/orders/${encodeURIComponent(order.code)}`} className="text-sage-700 underline underline-offset-4">
          جزئیات سفارش
        </Link>{' '}
        · سفارش‌های پرداخت‌نشده پس از مدتی به‌طور خودکار لغو می‌شوند.
      </p>
    </div>
  );
}
