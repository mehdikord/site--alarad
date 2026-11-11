'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, Package, Search, User as UserIcon, MapPin } from 'lucide-react';
import { useAuth, useOrders, useHydrated, useUi } from '@/lib/store';
import { STATUS_META } from '@/lib/store/orders';
import { date, num, toman, isValidIranPhone, normalizePhone } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { EmptyState, Stars } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function AccountView() {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const logout = useAuth((s) => s.logout);
  const orders = useOrders((s) => s.orders);
  const notify = useUi((s) => s.notify);

  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [form, setForm] = React.useState({ name: '', phone: '', code: '', sent: false });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [tab, setTab] = React.useState<'orders' | 'track' | 'profile'>('orders');
  const [trackCode, setTrackCode] = React.useState('');

  const myOrders = user ? orders.filter((o) => normalizePhone(o.phone) === normalizePhone(user.phone)) : [];

  if (!hydrated) {
    return (
      <div className="container-x py-10">
        <div className="skeleton h-8 w-48 rounded-full" />
        <div className="mt-6 skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    const sendCode = (e: React.FormEvent) => {
      e.preventDefault();
      const err: Record<string, string> = {};
      if (!isValidIranPhone(form.phone)) err.phone = 'شمارهٔ همراه معتبر نیست.';
      if (mode === 'register' && form.name.trim().length < 3) err.name = 'نام خود را وارد کنید.';
      setErrors(err);
      if (Object.keys(err).length) return;
      setForm((f) => ({ ...f, sent: true }));
      notify('کد تأیید (آزمایشی: ۱۲۳۴) ارسال شد.', 'success');
    };

    const verify = (e: React.FormEvent) => {
      e.preventDefault();
      if (form.code.replace(/\D/g, '').length < 4) {
        setErrors({ code: 'کد ۴ رقمی را وارد کنید (آزمایشی: ۱۲۳۴).' });
        return;
      }
      login(form.name.trim() || 'مهمان الاردشاپ', normalizePhone(form.phone));
      notify('خوش آمدید 🤍', 'success');
    };

    return (
      <div className="container-x max-w-md py-8 sm:py-12">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cream-200 text-ink-600">
            <UserIcon className="size-5" strokeWidth={1.6} />
          </span>
          <h1 className="mt-4 text-h1 text-ink-900">{mode === 'login' ? 'ورود به حساب' : 'ساخت حساب تازه'}</h1>
          <p className="mt-2 text-[0.8125rem] leading-[1.9] text-ink-500">
            با شمارهٔ همراه وارد شوید تا سفارش‌ها، کد رهگیری و آدرس‌هایتان همیشه در دسترس باشد.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-line-soft bg-white p-5 shadow-soft sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-cream-100 p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setForm({ name: '', phone: '', code: '', sent: false });
                  setErrors({});
                }}
                className={cn(
                  'relative h-9 rounded-full text-[0.75rem] transition-colors duration-300',
                  mode === m ? 'text-ink-900' : 'text-ink-400',
                )}
              >
                {mode === m && (
                  <motion.span layoutId="auth-pill" className="absolute inset-0 rounded-full bg-white shadow-soft" transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} />
                )}
                <span className="relative">{m === 'login' ? 'ورود' : 'ثبت‌نام'}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!form.sent ? (
              <motion.form
                key="phone"
                onSubmit={sendCode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {mode === 'register' && (
                  <Input
                    label="نام و نام خانوادگی"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={errors.name}
                  />
                )}
                <Input
                  label="شمارهٔ همراه"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  ltr
                  inputMode="tel"
                  error={errors.phone}
                  hint="کد تأیید پیامک می‌شود (در نسخهٔ آزمایشی: ۱۲۳۴)"
                />
                <Button type="submit" size="lg" full>
                  دریافت کد تأیید
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="code"
                onSubmit={verify}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="rounded-lg bg-cream-100 px-3 py-2 text-[0.6875rem] text-ink-500">
                  کد برای {normalizePhone(form.phone)} ارسال شد.{' '}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, sent: false }))} className="text-sage-700 underline decoration-sage-300 underline-offset-4">
                    تغییر شماره
                  </button>
                </div>
                <Input
                  label="کد تأیید ۴ رقمی"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  ltr
                  inputMode="numeric"
                  error={errors.code}
                  autoFocus
                />
                <Button type="submit" size="lg" full>
                  ورود به حساب
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-[0.625rem] leading-relaxed text-ink-300">
          با ورود، شرایط استفاده و سیاست حفظ حریم خصوصی الاردشاپ را می‌پذیرید.
        </p>
      </div>
    );
  }

  const tracked = trackCode ? orders.find((o) => o.code.toLowerCase() === trackCode.trim().toLowerCase()) : null;

  return (
    <div className="container-x pt-5 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">حساب کاربری</p>
          <h1 className="text-h1 text-ink-900">سلام، {user.name.split(' ')[0]} 🤍</h1>
          <p className="mt-1 text-[0.75rem] text-ink-400" dir="ltr">
            {normalizePhone(user.phone)}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            notify('از حساب خارج شدید.');
          }}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[0.75rem] text-ink-500 transition-colors hover:border-blush-300 hover:text-blush-500"
        >
          <LogOut className="size-3.5" strokeWidth={1.8} />
          خروج
        </button>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line-soft">
        {[
          { id: 'orders', label: `سفارش‌های من (${num(myOrders.length)})` },
          { id: 'track', label: 'پیگیری مرسوله' },
          { id: 'profile', label: 'اطلاعات حساب' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'relative shrink-0 px-3.5 pb-2.5 pt-1 text-[0.8125rem] transition-colors',
              tab === t.id ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700',
            )}
          >
            {t.label}
            {tab === t.id && (
              <motion.span layoutId="account-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-sage-500" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'orders' &&
          (myOrders.length === 0 ? (
            <EmptyState
              variant="box"
              title="هنوز سفارشی ثبت نکرده‌اید"
              description="اولین انتخاب‌های شما اینجا ظاهر می‌شوند؛ با خیال راحت شروع کنید."
              action={
                <Link href="/shop" className="inline-flex h-11 items-center rounded-xl bg-ink-900 px-5 text-[0.8125rem] text-cream-50">
                  مشاهدهٔ محصولات
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {myOrders.map((o) => {
                const meta = STATUS_META[o.status];
                return (
                  <motion.li
                    key={o.code}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-line-soft bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.75rem] font-medium text-ink-900" dir="ltr">
                            {o.code}
                          </span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[0.625rem]', meta.tone)}>{meta.label}</span>
                        </div>
                        <p className="mt-1 text-[0.6875rem] text-ink-400">
                          {date(o.createdAt)} · {num(o.totals.itemCount)} قلم · {toman(o.totals.grandTotal)}
                        </p>
                      </div>
                      <Link
                        href={`/account/orders/${o.code}`}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
                      >
                        جزئیات و پیگیری
                        <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
                      </Link>
                    </div>

                    {/* mini timeline */}
                    <ol className="mt-3 flex items-center gap-1">
                      {(['processing', 'shipped', 'delivered'] as const).map((s, i) => {
                        const idx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(o.status);
                        const active = idx >= i + 1;
                        return (
                          <li key={s} className="flex flex-1 items-center gap-1">
                            <span className={cn('size-1.5 shrink-0 rounded-full', active ? 'bg-sage-500' : 'bg-cream-300')} />
                            {i < 2 && <span className={cn('h-px flex-1', active ? 'bg-sage-300' : 'bg-cream-200')} />}
                          </li>
                        );
                      })}
                    </ol>
                  </motion.li>
                );
              })}
            </ul>
          ))}

        {tab === 'track' && (
          <div className="rounded-xl border border-line-soft bg-white p-5">
            <h2 className="text-[0.9375rem] font-semibold text-ink-900">پیگیری با کد رهگیری</h2>
            <p className="mt-1 text-[0.75rem] leading-[1.9] text-ink-500">
              کد رهگیری سفارش (مثل AL-1405-6712) را وارد کنید تا وضعیت مرسوله را ببینید.
            </p>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" strokeWidth={1.8} />
                <input
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="AL-1405-6712"
                  dir="ltr"
                  className="h-11 w-full rounded-xl border border-line bg-cream-100/60 ps-9 pe-3 text-[0.75rem] outline-none transition-colors focus:border-sage-400 focus:bg-white"
                />
              </div>
              <Link
                href={tracked ? `/account/orders/${tracked.code}` : '#'}
                aria-disabled={!tracked}
                className={cn(
                  'flex h-11 items-center rounded-xl px-4 text-[0.75rem] font-medium transition-colors',
                  tracked ? 'bg-ink-900 text-cream-50 hover:bg-ink-800' : 'pointer-events-none bg-cream-200 text-ink-300',
                )}
              >
                پیگیری
              </Link>
            </div>
            {tracked && (
              <div className="mt-3 rounded-lg bg-sage-50 px-3 py-2.5 text-[0.75rem] text-sage-700">
                سفارش {tracked.code} — {STATUS_META[tracked.status].label}
              </div>
            )}
            {trackCode && !tracked && (
              <div className="mt-3 rounded-lg bg-blush-100 px-3 py-2.5 text-[0.75rem] text-blush-500">
                کدی با این شماره پیدا نشد. کد را از پیامک تأیید سفارش بررسی کنید.
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line-soft bg-white p-4">
              <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-900">
                <UserIcon className="size-3.5 text-sage-600" strokeWidth={1.8} />
                اطلاعات شخصی
              </p>
              <p className="mt-2 text-[0.8125rem] text-ink-700">{user.name}</p>
              <p className="text-[0.75rem] text-ink-400" dir="ltr">{normalizePhone(user.phone)}</p>
            </div>
            <div className="rounded-xl border border-line-soft bg-white p-4">
              <p className="flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-900">
                <MapPin className="size-3.5 text-sage-600" strokeWidth={1.8} />
                آدرس پیش‌فرض
              </p>
              {myOrders[0] ? (
                <p className="mt-2 text-[0.75rem] leading-[1.9] text-ink-500">
                  {myOrders[0].address.province}، {myOrders[0].address.city}، {myOrders[0].address.line1}
                </p>
              ) : (
                <p className="mt-2 text-[0.75rem] text-ink-400">هنوز آدرسی ثبت نشده است.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { Stars, Image, Package };
