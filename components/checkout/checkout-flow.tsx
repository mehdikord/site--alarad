'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, CreditCard, Lock, MapPin, Package, ShieldCheck, Wallet } from 'lucide-react';
import type { Address, ShippingMethod } from '@/lib/types';
import { SHIPPING_METHODS, PROVINCES, CITIES_BY_PROVINCE, FREE_SHIPPING_THRESHOLD } from '@/lib/data/taxonomy';
import { computeTotals } from '@/lib/pricing';
import { money, num, toman, isValidIranPhone, isValidPostal, toLatinDigits, normalizePhone } from '@/lib/format';
import { formatCardNumber, formatExpiry, cn } from '@/lib/utils';
import { useCart, useHydrated, useAuth, useOrders, useUi } from '@/lib/store';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input, Textarea, Checkbox, RadioCard, Select } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/misc';
import { OrderSummary } from '@/components/cart/order-summary';

const STEPS = [
  { id: 1, title: 'اطلاعات ارسال', icon: MapPin },
  { id: 2, title: 'روش ارسال', icon: Package },
  { id: 3, title: 'پرداخت', icon: CreditCard },
];

const EMPTY: Address = { fullName: '', phone: '', province: '', city: '', postalCode: '', line1: '', line2: '', notes: '' };

export function CheckoutFlow() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear } = useCart();
  const user = useAuth((s) => s.user);
  const place = useOrders((s) => s.place);
  const notify = useUi((s) => s.notify);

  const [step, setStep] = React.useState(1);
  const [address, setAddress] = React.useState<Address>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof Address, string>>>({});
  const [shipping, setShipping] = React.useState<ShippingMethod>(SHIPPING_METHODS[0]);
  const [coupon, setCoupon] = React.useState<{ code: string; amount: number; label?: string } | null>(null);
  const [saveAddress, setSaveAddress] = React.useState(true);
  const [payMethod, setPayMethod] = React.useState<'gateway' | 'cod'>('gateway');
  const [card, setCard] = React.useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paying, setPaying] = React.useState(false);
  const [cardErrors, setCardErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (user) setAddress((a) => ({ ...a, fullName: a.fullName || user.name, phone: a.phone || user.phone }));
  }, [user]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingCost = shipping.id === 'pickup' ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shipping.cost;
  const totals = computeTotals(items, { shipping, coupon });

  if (!hydrated) {
    return (
      <div className="container-x py-12">
        <div className="skeleton mx-auto h-10 w-64 rounded-full" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="skeleton h-96 rounded-xl" />
          <div className="skeleton h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x">
        <EmptyState
          variant="bag"
          title="برای پرداخت، سبد شما باید کالا داشته باشد"
          description="یک قدم تا سفارش فاصله دارید؛ محصولی را انتخاب کنید و به این صفحه برگردید."
          action={<ButtonLink href="/shop" variant="primary" size="md">مشاهدهٔ محصولات</ButtonLink>}
        />
      </div>
    );
  }

  const validateAddress = () => {
    const e: Partial<Record<keyof Address, string>> = {};
    if (address.fullName.trim().length < 3) e.fullName = 'نام و نام خانوادگی را کامل وارد کنید.';
    if (!isValidIranPhone(address.phone)) e.phone = 'شمارهٔ همراه معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).';
    if (!address.province) e.province = 'استان را انتخاب کنید.';
    if (!address.city.trim()) e.city = 'شهر را وارد کنید.';
    if (!isValidPostal(address.postalCode)) e.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
    if (address.line1.trim().length < 10) e.line1 = 'نشانی را کامل‌تر بنویسید (خیابان، کوچه، پلاک).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    if (payMethod === 'cod') return true;
    const e: Record<string, string> = {};
    if (card.number.replace(/\s/g, '').length !== 16) e.number = 'شمارهٔ کارت باید ۱۶ رقم باشد.';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'تاریخ را به شکل ماه/سال وارد کنید.';
    if (card.cvv.length < 3) e.cvv = 'کد CVV2 سه یا چهار رقم است.';
    if (card.name.trim().length < 3) e.name = 'نام صاحب کارت را وارد کنید.';
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validatePayment()) return;
    setPaying(true);
    // mock gateway round-trip
    setTimeout(() => {
      const order = place({
        items,
        address: { ...address, phone: normalizePhone(address.phone), postalCode: toLatinDigits(address.postalCode) },
        shipping: { ...shipping, cost: shippingCost },
        totals,
        coupon: coupon ? { code: coupon.code, amount: coupon.amount } : undefined,
        payment: { maskedCard: card.number ? `${card.number.slice(0, 4)} **** **** ${card.number.slice(-4)}` : 'پرداخت در محل' },
      });
      clear();
      router.push(`/checkout/success/${order.code}`);
    }, 1700);
  };

  const cities = CITIES_BY_PROVINCE[address.province] ?? [];

  return (
    <div className="container-x pt-5 sm:pt-8">
      <nav aria-label="مسیر" className="mb-4 flex items-center gap-1.5 text-[0.6875rem] text-ink-300">
        <Link href="/cart" className="hover:text-ink-700">سبد خرید</Link>
        <span>/</span>
        <span className="text-ink-500">پرداخت</span>
      </nav>

      {/* stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => done && setStep(s.id)}
                disabled={!done}
                className="flex items-center gap-2 text-start"
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] transition-all duration-400 ease-silk',
                    active ? 'bg-ink-900 text-cream-50' : done ? 'bg-sage-500 text-white' : 'bg-cream-200 text-ink-400',
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : num(s.id)}
                </span>
                <span className={cn('hidden text-[0.75rem] sm:block', active ? 'font-medium text-ink-900' : 'text-ink-400')}>
                  {s.title}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="relative h-px flex-1 overflow-hidden bg-cream-300">
                  <motion.span
                    className="absolute inset-y-0 start-0 bg-sage-400"
                    initial={false}
                    animate={{ width: step > s.id ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
          <AnimatePresence mode="wait" initial={false}>
            {/* ───────────── step 1: address ───────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="p-4 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="size-4 text-sage-600" strokeWidth={1.8} />
                  <h2 className="text-[0.9375rem] font-semibold text-ink-900">اطلاعات گیرنده</h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="نام و نام خانوادگی"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    error={errors.fullName}
                    autoComplete="name"
                  />
                  <Input
                    label="شمارهٔ همراه"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    error={errors.phone}
                    ltr
                    inputMode="tel"
                    autoComplete="tel"
                    hint="برای هماهنگی ارسال و پیگیری سفارش"
                  />
                  <Select
                    label="استان"
                    value={address.province}
                    onChange={(e) => setAddress({ ...address, province: e.target.value, city: '' })}
                    options={PROVINCES.map((p) => ({ value: p, label: p }))}
                    error={errors.province}
                  />
                  {cities.length ? (
                    <Select
                      label="شهر"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      options={cities.map((c) => ({ value: c, label: c }))}
                      error={errors.city}
                    />
                  ) : (
                    <Input
                      label="شهر"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      error={errors.city}
                      autoComplete="address-level2"
                    />
                  )}
                  <Input
                    label="کد پستی (۱۰ رقم)"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    error={errors.postalCode}
                    ltr
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="نشانی کامل"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      error={errors.line1}
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="پلاک، واحد، طبقه (اختیاری)"
                      value={address.line2 ?? ''}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      label="توضیح برای پیک (اختیاری)"
                      value={address.notes ?? ''}
                      onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-cream-100/80 p-3">
                  <Checkbox checked={saveAddress} onChange={setSaveAddress}>
                    این نشانی را برای سفارش‌های بعدی نگه دار
                  </Checkbox>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <ButtonLink href="/cart" variant="ghost" size="md">
                    بازگشت به سبد
                  </ButtonLink>
                  <Button
                    onClick={() => {
                      if (validateAddress()) setStep(2);
                    }}
                    size="lg"
                    className="sm:min-w-[190px]"
                  >
                    ادامه و انتخاب ارسال
                    <ArrowLeft className="size-4" strokeWidth={2} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ───────────── step 2: shipping ───────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="p-4 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Package className="size-4 text-sage-600" strokeWidth={1.8} />
                  <h2 className="text-[0.9375rem] font-semibold text-ink-900">روش ارسال</h2>
                </div>

                <div className="mb-5 flex items-start gap-2 rounded-xl border border-line-soft bg-cream-50 p-3">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-300" strokeWidth={1.8} />
                  <div className="min-w-0 flex-1 text-[0.75rem] leading-relaxed text-ink-600">
                    <p className="font-medium text-ink-900">{address.fullName} — {normalizePhone(address.phone)}</p>
                    <p className="mt-0.5 line-clamp-2">
                      {address.province}، {address.city}، {address.line1}
                      {address.line2 ? `، ${address.line2}` : ''} — کد پستی {toLatinDigits(address.postalCode)}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="shrink-0 text-[0.6875rem] text-sage-700 underline decoration-sage-300 underline-offset-4">
                    ویرایش
                  </button>
                </div>

                <div className="space-y-2.5">
                  {SHIPPING_METHODS.map((m) => {
                    const free = m.id !== 'pickup' && subtotal >= FREE_SHIPPING_THRESHOLD;
                    const cost = m.id === 'pickup' || free ? 0 : m.cost;
                    return (
                      <RadioCard key={m.id} active={shipping.id === m.id} onClick={() => setShipping(m)}>
                        <div className="pe-7">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.8125rem] font-medium text-ink-900">{m.title}</span>
                            {m.id === 'express' && (
                              <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[0.5625rem] text-blush-500">سریع‌ترین</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[0.6875rem] text-ink-400">{m.description}</p>
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[0.6875rem]">
                            <span className="text-ink-400">{m.eta}</span>
                            <span className="font-medium text-ink-900">
                              {cost === 0 ? 'رایگان' : toman(cost)}
                              {free && m.id !== 'pickup' && (
                                <span className="ms-1.5 text-[0.5625rem] font-normal text-sage-700 line-through-none">(ارسال رایگان)</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </RadioCard>
                    );
                  })}
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-[0.625rem] text-ink-300">
                  <ShieldCheck className="size-3.5 text-sage-600" strokeWidth={1.8} />
                  همهٔ مرسوله‌ها با بسته‌بندی محرمانه و کد رهگیری ارسال می‌شوند.
                </p>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button variant="ghost" size="md" onClick={() => setStep(1)}>
                    <ArrowRight className="size-4" strokeWidth={2} />
                    مرحلهٔ قبل
                  </Button>
                  <Button onClick={() => setStep(3)} size="lg" className="sm:min-w-[170px]">
                    ادامه به پرداخت
                    <ArrowLeft className="size-4" strokeWidth={2} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ───────────── step 3: payment ───────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="p-4 sm:p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="size-4 text-sage-600" strokeWidth={1.8} />
                  <h2 className="text-[0.9375rem] font-semibold text-ink-900">پرداخت</h2>
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  <RadioCard active={payMethod === 'gateway'} onClick={() => setPayMethod('gateway')}>
                    <div className="pe-7">
                      <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                        <CreditCard className="size-3.5" strokeWidth={1.8} />
                        درگاه پرداخت اینترنتی
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-ink-400">کارت‌های عضو شتاب</p>
                    </div>
                  </RadioCard>
                  <RadioCard active={payMethod === 'cod'} onClick={() => setPayMethod('cod')}>
                    <div className="pe-7">
                      <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                        <Wallet className="size-3.5" strokeWidth={1.8} />
                        پرداخت در محل
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-ink-400">فقط تهران و کرج</p>
                    </div>
                  </RadioCard>
                </div>

                <AnimatePresence initial={false}>
                  {payMethod === 'gateway' ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-sage-200 bg-sage-50/60 p-3.5">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[0.75rem] font-medium text-ink-800">کارت بانکی</p>
                          <span className="flex items-center gap-1 text-[0.625rem] text-sage-700">
                            <Lock className="size-3" strokeWidth={2} />
                            اتصال امن
                          </span>
                        </div>

                        {/* mock card preview */}
                        <div className="mb-3 overflow-hidden rounded-xl bg-gradient-to-bl from-ink-800 to-ink-900 p-3.5 text-cream-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[0.5625rem] tracking-[0.2em] text-cream-300/80">ALARAD PAY</span>
                            <span className="flex gap-1">
                              <span className="size-3 rounded-full bg-cream-300/50" />
                              <span className="size-3 -translate-x-1.5 rounded-full bg-cream-300/30" />
                            </span>
                          </div>
                          <p className="mt-4 font-mono text-[0.9375rem] tracking-[0.18em] text-cream-50" dir="ltr">
                            {card.number || '•••• •••• •••• ••••'}
                          </p>
                          <div className="mt-3 flex items-end justify-between text-[0.5625rem]">
                            <span className="truncate text-cream-200/90">{card.name || 'نام صاحب کارت'}</span>
                            <span dir="ltr" className="text-cream-200/90">{card.expiry || 'MM/YY'}</span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Input
                              label="شمارهٔ کارت"
                              value={card.number}
                              onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                              ltr
                              inputMode="numeric"
                              error={cardErrors.number}
                              maxLength={19}
                            />
                          </div>
                          <Input
                            label="تاریخ انقضا"
                            value={card.expiry}
                            onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                            ltr
                            inputMode="numeric"
                            placeholder=""
                            error={cardErrors.expiry}
                            maxLength={5}
                          />
                          <Input
                            label="CVV2"
                            value={card.cvv}
                            onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            ltr
                            inputMode="numeric"
                            error={cardErrors.cvv}
                          />
                          <div className="sm:col-span-2">
                            <Input
                              label="نام صاحب کارت"
                              value={card.name}
                              onChange={(e) => setCard({ ...card, name: e.target.value })}
                              error={cardErrors.name}
                            />
                          </div>
                        </div>
                        <p className="mt-2.5 text-[0.625rem] leading-relaxed text-ink-400">
                          این یک درگاه آزمایشی است؛ هیچ مبلغی برداشت نمی‌شود و اطلاعات کارت ذخیره نمی‌گردد. برای تست:
                          ۶۰۳۷۹۹۱۱۱۱۱۱۱۱۱۱
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-line-soft bg-cream-100/80 p-3.5 text-[0.75rem] leading-relaxed text-ink-600">
                        مبلغ سفارش را هنگام تحویل، نقدی یا با کارت‌خوان پیک پرداخت می‌کنید. پرداخت در محل فقط برای تهران و کرج فعال است.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* review */}
                <div className="mt-5 rounded-xl border border-line-soft">
                  <p className="border-b border-line-soft px-3.5 py-2.5 text-[0.75rem] font-medium text-ink-800">
                    بازبینی نهایی
                  </p>
                  <div className="space-y-1.5 p-3.5 text-[0.6875rem] text-ink-500">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3 shrink-0 text-ink-300" />
                      <span>{address.province}، {address.city}، {address.line1}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Package className="mt-0.5 size-3 shrink-0 text-ink-300" />
                      <span>{shipping.title} — {shipping.eta}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <ShieldCheck className="mt-0.5 size-3 shrink-0 text-ink-300" />
                      <span>{payMethod === 'gateway' ? 'پرداخت اینترنتی' : 'پرداخت در محل'} · {num(totals.itemCount)} قلم کالا</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button variant="ghost" size="md" onClick={() => setStep(2)}>
                    <ArrowRight className="size-4" strokeWidth={2} />
                    مرحلهٔ قبل
                  </Button>
                  <Button onClick={handlePay} loading={paying} size="lg" className="sm:min-w-[230px]">
                    {paying ? 'در حال اتصال به درگاه…' : `پرداخت ${toman(totals.grandTotal)}`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-24">
          <OrderSummary
            items={items}
            shippingCost={shippingCost}
            shippingTitle={shipping.title}
            coupon={coupon}
            onCoupon={setCoupon}
            showItems
            compact
            showCoupon
          />
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.625rem] text-ink-300">
            <Lock className="size-3" strokeWidth={2} />
            اطلاعات شما رمزنگاری می‌شود
          </div>
        </div>
      </div>
    </div>
  );
}
