'use client';

import * as React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { toman } from '@/lib/format';
import { formatCardNumber, formatExpiry } from '@/lib/utils';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export function MockGateway({
  paymentId,
  authority,
  amount,
  orderCode,
  closed,
}: {
  paymentId: number;
  authority: string;
  amount: number;
  orderCode: string;
  closed: boolean;
}) {
  const [card, setCard] = React.useState({ number: '', expiry: '', cvv: '', pin: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  const go = (status: 'OK' | 'NOK') => {
    const digits = card.number.replace(/\D/g, '');
    const qs = new URLSearchParams({
      payment: String(paymentId),
      Authority: authority,
      Status: status,
      ...(status === 'OK' ? { card: `${digits.slice(0, 6)}******${digits.slice(-4)}` } : {}),
    });
    setBusy(true);
    window.location.href = `/api/payments/callback?${qs.toString()}`;
  };

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (card.number.replace(/\D/g, '').length !== 16) er.number = 'شمارهٔ کارت باید ۱۶ رقم باشد.';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) er.expiry = 'به شکل ماه/سال';
    if (card.cvv.length < 3) er.cvv = 'CVV2 نامعتبر';
    if (card.pin.length < 5) er.pin = 'رمز دوم حداقل ۵ رقم';
    setErrors(er);
    if (Object.keys(er).length === 0) go('OK');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-100 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line-soft bg-white shadow-soft">
        <div className="flex items-center justify-between bg-ink-900 px-5 py-4 text-cream-50">
          <div>
            <p className="text-[0.625rem] tracking-[0.25em] text-cream-300/80">SHAPARAK · TEST</p>
            <p className="mt-0.5 text-[0.9375rem] font-semibold">درگاه پرداخت آزمایشی</p>
          </div>
          <Lock className="size-5 text-sage-300" strokeWidth={1.8} />
        </div>

        <div className="border-b border-line-soft px-5 py-4 text-[0.8125rem]">
          <div className="flex justify-between">
            <span className="text-ink-400">پذیرنده</span>
            <span className="text-ink-800">الاردشاپ</span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-ink-400">شمارهٔ سفارش</span>
            <span className="text-ink-800" dir="ltr">{orderCode}</span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-ink-400">مبلغ</span>
            <span className="font-semibold text-ink-900">{toman(amount)}</span>
          </div>
        </div>

        {closed ? (
          <div className="p-5 text-center text-[0.8125rem] text-ink-500">
            این تراکنش قبلاً بسته شده است.
            <div className="mt-4">
              <a href="/account" className="text-sage-700 underline underline-offset-4">بازگشت به حساب کاربری</a>
            </div>
          </div>
        ) : (
          <form onSubmit={pay} className="space-y-3 p-5">
            <Input label="شمارهٔ کارت" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} ltr inputMode="numeric" maxLength={19} error={errors.number} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="CVV2" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} ltr inputMode="numeric" error={errors.cvv} />
              <Input label="تاریخ انقضا" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} ltr inputMode="numeric" maxLength={5} error={errors.expiry} />
            </div>
            <Input label="رمز دوم (پویا)" type="password" value={card.pin} onChange={(e) => setCard({ ...card, pin: e.target.value.replace(/\D/g, '').slice(0, 12) })} ltr inputMode="numeric" error={errors.pin} />
            <p className="rounded-lg bg-cream-100 px-3 py-2 text-[0.6875rem] leading-relaxed text-ink-500">
              این صفحه فقط برای تست است و هیچ مبلغی برداشت نمی‌شود. هر کارت ۱۶ رقمی (مثلاً ۶۰۳۷۹۹۱۱۱۱۱۱۱۱۱۱) پذیرفته می‌شود.
            </p>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="lg" className="flex-1" loading={busy}>
                پرداخت
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => go('NOK')} disabled={busy}>
                انصراف
              </Button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[0.625rem] text-ink-300">
              <ShieldCheck className="size-3.5 text-sage-600" strokeWidth={1.8} />
              اتصال امن — آزمایشی
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
