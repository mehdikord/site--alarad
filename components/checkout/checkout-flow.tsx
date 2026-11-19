'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CreditCard, Lock, MapPin, Package, Plus, ShieldCheck, User as UserIcon, Wallet } from 'lucide-react';
import type { Address } from '@/lib/types';
import { num, toman, isValidIranPhone, isValidPostal, toLatinDigits, normalizePhone } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCart, useHydrated, useAuth, useUi, api } from '@/lib/store';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input, Textarea, Checkbox, RadioCard, Select } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/misc';
import { OrderSummary } from '@/components/cart/order-summary';
import { OtpLogin } from '@/components/account/otp-login';

const STEPS = [
  { id: 1, title: 'اطلاعات ارسال', icon: MapPin },
  { id: 2, title: 'روش ارسال', icon: Package },
  { id: 3, title: 'پرداخت', icon: CreditCard },
];

const EMPTY: Address = { fullName: '', phone: '', provinceId: null, cityId: null, postalCode: '', line1: '', line2: '', notes: '' };

interface Option {
  id: number;
  name: string;
}

interface SavedAddress {
  id: number;
  title: string;
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  provinceName: string;
  cityId: number;
  cityName: string;
  postalCode: string;
  address: string;
  unit: string;
  isDefault: boolean;
}

interface QuoteMethod {
  id: number;
  code: string;
  title: string;
  description: string;
  eta: string;
  baseCost: number;
  cost: number;
  supportsCod: boolean;
}

interface Quote {
  shippingMethods: QuoteMethod[];
  selectedShippingId: number | null;
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number; itemCount: number };
  coupon: { code: string; amount: number; message: string } | null;
  couponError: string | null;
  codAvailable: boolean;
  lines: { variantId: string; unitPrice: number; qty: number; maxStock: number }[];
  removed: string[];
  issues: string[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function CheckoutFlow() {
  const hydrated = useHydrated();
  const { items, clear, sync } = useCart();
  const user = useAuth((s) => s.user);
  const authReady = useAuth((s) => s.ready);
  const notify = useUi((s) => s.notify);

  const [step, setStep] = React.useState(1);
  const [address, setAddress] = React.useState<Address>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof Address, string>>>({});
  const [provinces, setProvinces] = React.useState<Option[]>([]);
  const [cities, setCities] = React.useState<Option[]>([]);
  const [saved, setSaved] = React.useState<SavedAddress[]>([]);
  const [addressId, setAddressId] = React.useState<number | null>(null); // selected saved address (null = new)
  const [saveAddress, setSaveAddress] = React.useState(true);
  const [shippingId, setShippingId] = React.useState<number | null>(null);
  const [coupon, setCoupon] = React.useState<{ code: string; amount: number; label?: string } | null>(null);
  const [payMethod, setPayMethod] = React.useState<'online' | 'cod'>('online');
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [quoting, setQuoting] = React.useState(false);
  const [paying, setPaying] = React.useState(false);

  const lines = React.useMemo(() => items.map((i) => ({ variantId: i.variantId, qty: i.qty })), [items]);

  /* ── reference data ── */
  React.useEffect(() => {
    void api<{ provinces: Option[] }>('/api/geo/provinces').then((r) => r.ok && setProvinces(r.provinces));
  }, []);

  React.useEffect(() => {
    if (!user) return;
    setAddress((a) => ({ ...a, fullName: a.fullName || user.name, phone: a.phone || user.phone }));
    void api<{ addresses: SavedAddress[] }>('/api/account/addresses').then((r) => {
      if (!r.ok) return;
      setSaved(r.addresses);
      const def = r.addresses.find((a) => a.isDefault) ?? r.addresses[0];
      if (def) pickSaved(def);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  React.useEffect(() => {
    if (!address.provinceId) {
      setCities([]);
      return;
    }
    let alive = true;
    void api<{ cities: Option[] }>(`/api/geo/cities?province=${address.provinceId}`).then((r) => alive && r.ok && setCities(r.cities));
    return () => {
      alive = false;
    };
  }, [address.provinceId]);

  /* ── live server quote ── */
  React.useEffect(() => {
    if (!lines.length) return;
    let alive = true;
    setQuoting(true);
    const t = setTimeout(async () => {
      const r = await api<Quote>('/api/checkout/quote', {
        lines,
        provinceId: address.provinceId,
        shippingMethodId: shippingId,
        couponCode: coupon?.code ?? null,
      });
      if (!alive) return;
      setQuoting(false);
      if (!r.ok) return;
      setQuote(r);
      if (r.selectedShippingId !== shippingId) setShippingId(r.selectedShippingId);
      if (coupon && r.couponError) {
        notify(r.couponError, 'error');
        setCoupon(null);
      }
      if (!r.codAvailable) setPayMethod('online');
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, address.provinceId, shippingId, coupon?.code]);

  function pickSaved(a: SavedAddress) {
    setAddressId(a.id);
    setAddress((cur) => ({
      ...cur,
      fullName: a.receiverName,
      phone: a.receiverPhone,
      provinceId: a.provinceId,
      cityId: a.cityId,
      postalCode: a.postalCode,
      line1: a.address,
      line2: a.unit,
    }));
    setErrors({});
  }

  if (!hydrated || !authReady) {
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

  const provinceName = provinces.find((p) => p.id === address.provinceId)?.name ?? '';
  const cityName = cities.find((c) => c.id === address.cityId)?.name ?? saved.find((s) => s.cityId === address.cityId)?.cityName ?? '';
  const methods = quote?.shippingMethods ?? [];
  const method = methods.find((m) => m.id === shippingId) ?? null;

  const validateAddress = () => {
    const e: Partial<Record<keyof Address, string>> = {};
    if (address.fullName.trim().length < 3) e.fullName = 'نام و نام خانوادگی را کامل وارد کنید.';
    if (!isValidIranPhone(address.phone)) e.phone = 'شمارهٔ همراه معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).';
    if (!address.provinceId) e.provinceId = 'استان را انتخاب کنید.';
    if (!address.cityId) e.cityId = 'شهر را انتخاب کنید.';
    if (!isValidPostal(address.postalCode)) e.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
    if (address.line1.trim().length < 10) e.line1 = 'نشانی را کامل‌تر بنویسید (خیابان، کوچه، پلاک).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!method) {
      notify('روش ارسال را انتخاب کنید.', 'error');
      setStep(2);
      return;
    }
    setPaying(true);
    const res = await api<{ redirectUrl?: string; code?: string; errors?: Record<string, string>; cartChanged?: boolean; lines?: Quote['lines']; removed?: string[] }>(
      '/api/checkout',
      {
        lines,
        receiver: {
          fullName: address.fullName,
          phone: normalizePhone(address.phone),
          provinceId: address.provinceId,
          cityId: address.cityId,
          postalCode: toLatinDigits(address.postalCode),
          line1: address.line1,
          line2: address.line2,
          notes: address.notes,
        },
        addressId,
        saveAddress: addressId === null && saveAddress,
        shippingMethodId: method.id,
        couponCode: coupon?.code ?? null,
        paymentMethod: payMethod,
      },
    );
    if (!res.ok) {
      setPaying(false);
      notify(res.message ?? 'ثبت سفارش ناموفق بود.', 'error');
      if (res.errors) {
        setErrors(res.errors as typeof errors);
        setStep(1);
      }
      if (res.cartChanged && res.lines) sync(res.lines.map((l) => ({ variantId: l.variantId, price: l.unitPrice, maxStock: l.maxStock })), res.removed ?? []);
      return;
    }
    clear();
    if (res.message) notify(res.message, 'error');
    window.location.href = res.redirectUrl ?? `/checkout/success/${res.code}`;
  };

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
                <span className={cn('hidden text-[0.75rem] sm:block', active ? 'font-medium text-ink-900' : 'text-ink-400')}>{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="relative h-px flex-1 overflow-hidden bg-cream-300">
                  <motion.span
                    className="absolute inset-y-0 start-0 bg-sage-400"
                    initial={false}
                    animate={{ width: step > s.id ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
          {!user ? (
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <UserIcon className="size-4 text-sage-600" strokeWidth={1.8} />
                <h2 className="text-[0.9375rem] font-semibold text-ink-900">ورود برای ثبت سفارش</h2>
              </div>
              <p className="mb-5 max-w-md text-[0.8125rem] leading-[1.9] text-ink-500">
                برای ثبت سفارش و پیگیری مرسوله، با شمارهٔ همراه وارد شوید. اگر حساب ندارید، همین‌جا ساخته می‌شود.
              </p>
              <div className="max-w-sm">
                <OtpLogin compact />
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {/* ───────────── step 1: address ───────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="p-4 sm:p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="size-4 text-sage-600" strokeWidth={1.8} />
                    <h2 className="text-[0.9375rem] font-semibold text-ink-900">اطلاعات گیرنده</h2>
                  </div>

                  {saved.length > 0 && (
                    <div className="mb-5 space-y-2">
                      <p className="text-[0.75rem] text-ink-500">نشانی‌های ذخیره‌شده</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {saved.map((a) => (
                          <RadioCard key={a.id} active={addressId === a.id} onClick={() => pickSaved(a)}>
                            <div className="pe-7 text-[0.75rem] leading-relaxed">
                              <p className="font-medium text-ink-900">
                                {a.title || a.receiverName}
                                {a.isDefault && <span className="ms-1.5 rounded-full bg-sage-100 px-1.5 py-0.5 text-[0.5625rem] text-sage-700">پیش‌فرض</span>}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-ink-500">
                                {a.provinceName}، {a.cityName}، {a.address}
                              </p>
                            </div>
                          </RadioCard>
                        ))}
                        <RadioCard
                          active={addressId === null}
                          onClick={() => {
                            setAddressId(null);
                            setAddress({ ...EMPTY, fullName: user.name, phone: user.phone });
                          }}
                        >
                          <span className="flex items-center gap-1.5 pe-7 text-[0.75rem] font-medium text-ink-700">
                            <Plus className="size-3.5" strokeWidth={2} />
                            نشانی جدید
                          </span>
                        </RadioCard>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="نام و نام خانوادگی گیرنده"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      error={errors.fullName}
                      autoComplete="name"
                    />
                    <Input
                      label="شمارهٔ همراه گیرنده"
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
                      value={address.provinceId ? String(address.provinceId) : ''}
                      onChange={(e) => {
                        setAddressId(null);
                        setAddress({ ...address, provinceId: Number(e.target.value) || null, cityId: null });
                      }}
                      options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
                      error={errors.provinceId}
                    />
                    <Select
                      label={address.provinceId ? 'شهر' : 'شهر (ابتدا استان را انتخاب کنید)'}
                      value={address.cityId ? String(address.cityId) : ''}
                      onChange={(e) => {
                        setAddressId(null);
                        setAddress({ ...address, cityId: Number(e.target.value) || null });
                      }}
                      options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
                      error={errors.cityId}
                      disabled={!address.provinceId}
                    />
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
                        onChange={(e) => {
                          setAddressId(null);
                          setAddress({ ...address, line1: e.target.value });
                        }}
                        error={errors.line1}
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input label="پلاک، واحد، طبقه (اختیاری)" value={address.line2 ?? ''} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
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

                  {addressId === null && (
                    <div className="mt-4 rounded-xl bg-cream-100/80 p-3">
                      <Checkbox checked={saveAddress} onChange={setSaveAddress}>
                        این نشانی را برای سفارش‌های بعدی نگه دار
                      </Checkbox>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <ButtonLink href="/cart" variant="ghost" size="md">
                      بازگشت به سبد
                    </ButtonLink>
                    <Button onClick={() => validateAddress() && setStep(2)} size="lg" className="sm:min-w-[190px]">
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
                  transition={{ duration: 0.3, ease: EASE }}
                  className="p-4 sm:p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="size-4 text-sage-600" strokeWidth={1.8} />
                    <h2 className="text-[0.9375rem] font-semibold text-ink-900">روش ارسال</h2>
                  </div>

                  <div className="mb-5 flex items-start gap-2 rounded-xl border border-line-soft bg-cream-50 p-3">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-300" strokeWidth={1.8} />
                    <div className="min-w-0 flex-1 text-[0.75rem] leading-relaxed text-ink-600">
                      <p className="font-medium text-ink-900">
                        {address.fullName} — <span dir="ltr">{normalizePhone(address.phone)}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2">
                        {provinceName}، {cityName}، {address.line1}
                        {address.line2 ? `، ${address.line2}` : ''} — کد پستی {toLatinDigits(address.postalCode)}
                      </p>
                    </div>
                    <button onClick={() => setStep(1)} className="shrink-0 text-[0.6875rem] text-sage-700 underline decoration-sage-300 underline-offset-4">
                      ویرایش
                    </button>
                  </div>

                  {methods.length === 0 ? (
                    <p className="rounded-xl bg-blush-100 px-4 py-3 text-[0.75rem] text-blush-500">
                      {quoting ? 'در حال بررسی روش‌های ارسال…' : 'برای این استان روش ارسال فعالی وجود ندارد؛ با پشتیبانی تماس بگیرید.'}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {methods.map((m) => (
                        <RadioCard key={m.id} active={shippingId === m.id} onClick={() => setShippingId(m.id)}>
                          <div className="pe-7">
                            <div className="flex items-center gap-2">
                              <span className="text-[0.8125rem] font-medium text-ink-900">{m.title}</span>
                              {m.code === 'express' && (
                                <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[0.5625rem] text-blush-500">سریع‌ترین</span>
                              )}
                            </div>
                            {m.description && <p className="mt-0.5 text-[0.6875rem] text-ink-400">{m.description}</p>}
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[0.6875rem]">
                              <span className="text-ink-400">{m.eta}</span>
                              <span className="font-medium text-ink-900">
                                {m.cost === 0 ? 'رایگان' : toman(m.cost)}
                                {m.cost === 0 && m.baseCost > 0 && (
                                  <span className="ms-1.5 text-[0.5625rem] font-normal text-ink-300 line-through">{toman(m.baseCost)}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </RadioCard>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 flex items-center gap-1.5 text-[0.625rem] text-ink-300">
                    <ShieldCheck className="size-3.5 text-sage-600" strokeWidth={1.8} />
                    همهٔ مرسوله‌ها با بسته‌بندی محرمانه و کد رهگیری ارسال می‌شوند.
                  </p>

                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button variant="ghost" size="md" onClick={() => setStep(1)}>
                      <ArrowRight className="size-4" strokeWidth={2} />
                      مرحلهٔ قبل
                    </Button>
                    <Button onClick={() => method && setStep(3)} disabled={!method} size="lg" className="sm:min-w-[170px]">
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
                  transition={{ duration: 0.3, ease: EASE }}
                  className="p-4 sm:p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard className="size-4 text-sage-600" strokeWidth={1.8} />
                    <h2 className="text-[0.9375rem] font-semibold text-ink-900">پرداخت</h2>
                  </div>

                  <div className="mb-4 grid gap-2 sm:grid-cols-2">
                    <RadioCard active={payMethod === 'online'} onClick={() => setPayMethod('online')}>
                      <div className="pe-7">
                        <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                          <CreditCard className="size-3.5" strokeWidth={1.8} />
                          درگاه پرداخت اینترنتی
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] text-ink-400">همهٔ کارت‌های عضو شتاب</p>
                      </div>
                    </RadioCard>
                    <RadioCard active={payMethod === 'cod'} onClick={() => quote?.codAvailable && setPayMethod('cod')}>
                      <div className={cn('pe-7', !quote?.codAvailable && 'opacity-50')}>
                        <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                          <Wallet className="size-3.5" strokeWidth={1.8} />
                          پرداخت در محل
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] text-ink-400">
                          {quote?.codAvailable ? 'پرداخت هنگام تحویل' : 'برای این روش ارسال فعال نیست'}
                        </p>
                      </div>
                    </RadioCard>
                  </div>

                  <div className="rounded-xl border border-sage-200 bg-sage-50/60 p-3.5 text-[0.75rem] leading-[1.9] text-ink-600">
                    {payMethod === 'online' ? (
                      <p className="flex items-start gap-2">
                        <Lock className="mt-1 size-3.5 shrink-0 text-sage-700" strokeWidth={2} />
                        پس از تأیید، به درگاه امن بانکی (شاپرک) منتقل می‌شوید. اطلاعات کارت فقط در صفحهٔ بانک وارد می‌شود و الاردشاپ به آن دسترسی ندارد.
                      </p>
                    ) : (
                      <p>مبلغ سفارش را هنگام تحویل، نقدی یا با کارت‌خوان پیک پرداخت می‌کنید.</p>
                    )}
                  </div>

                  {/* review */}
                  <div className="mt-5 rounded-xl border border-line-soft">
                    <p className="border-b border-line-soft px-3.5 py-2.5 text-[0.75rem] font-medium text-ink-800">بازبینی نهایی</p>
                    <div className="space-y-1.5 p-3.5 text-[0.6875rem] text-ink-500">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 size-3 shrink-0 text-ink-300" />
                        <span>
                          {provinceName}، {cityName}، {address.line1}
                        </span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <Package className="mt-0.5 size-3 shrink-0 text-ink-300" />
                        <span>
                          {method?.title} — {method?.eta}
                        </span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <ShieldCheck className="mt-0.5 size-3 shrink-0 text-ink-300" />
                        <span>
                          {payMethod === 'online' ? 'پرداخت اینترنتی' : 'پرداخت در محل'} · {num(quote?.totals.itemCount ?? 0)} قلم کالا
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button variant="ghost" size="md" onClick={() => setStep(2)}>
                      <ArrowRight className="size-4" strokeWidth={2} />
                      مرحلهٔ قبل
                    </Button>
                    <Button onClick={handlePay} loading={paying} disabled={!quote || quoting} size="lg" className="sm:min-w-[230px]">
                      {paying
                        ? payMethod === 'online'
                          ? 'در حال اتصال به درگاه…'
                          : 'در حال ثبت سفارش…'
                        : payMethod === 'online'
                          ? `پرداخت ${toman(quote?.totals.total ?? 0)}`
                          : 'ثبت نهایی سفارش'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-24">
          <OrderSummary
            items={items}
            shippingCost={method?.cost ?? 0}
            shippingTitle={method?.title}
            coupon={coupon}
            onCoupon={setCoupon}
            serverTotals={quote?.totals ?? null}
            showItems
            compact
            showCoupon
          />
          {quote && quote.issues.length > 0 && (
            <div className="mt-3 rounded-xl bg-blush-100 px-3 py-2.5 text-[0.6875rem] leading-relaxed text-blush-500">
              {quote.issues.map((i) => (
                <p key={i}>{i}</p>
              ))}
              <button
                type="button"
                onClick={() =>
                  sync(
                    quote.lines.map((l) => ({ variantId: l.variantId, price: l.unitPrice, maxStock: l.maxStock })),
                    quote.removed,
                  )
                }
                className="mt-1 underline underline-offset-4"
              >
                به‌روزرسانی سبد
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.625rem] text-ink-300">
            <Lock className="size-3" strokeWidth={2} />
            اطلاعات شما رمزنگاری می‌شود
          </div>
        </div>
      </div>
    </div>
  );
}
