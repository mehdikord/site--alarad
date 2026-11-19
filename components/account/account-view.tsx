'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, LogOut, MapPin, Plus, Search, Star, Trash2, User as UserIcon } from 'lucide-react';
import { api, useAuth, useHydrated, useUi } from '@/lib/store';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/order-meta';
import { date, num, toman, isValidIranPhone, isValidPostal, normalizePhone, toLatinDigits } from '@/lib/format';
import type { OrderView } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/misc';
import { OtpLogin } from '@/components/account/otp-login';
import { cn } from '@/lib/utils';

type Tab = 'orders' | 'track' | 'addresses' | 'wishlist' | 'profile';

interface SavedAddress {
  id: number;
  title: string;
  receiverName: string;
  receiverPhone: string;
  provinceName: string;
  cityName: string;
  postalCode: string;
  address: string;
  unit: string;
  isDefault: boolean;
}

export function AccountView() {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const logout = useAuth((s) => s.logout);
  const notify = useUi((s) => s.notify);
  const [tab, setTab] = React.useState<Tab>('orders');
  const [orders, setOrders] = React.useState<OrderView[] | null>(null);

  React.useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    void api<{ orders: OrderView[] }>('/api/account/orders').then((r) => setOrders(r.ok ? r.orders : []));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated || !ready) {
    return (
      <div className="container-x py-10">
        <div className="skeleton h-8 w-48 rounded-full" />
        <div className="mt-6 skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x max-w-md py-8 sm:py-12">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cream-200 text-ink-600">
            <UserIcon className="size-5" strokeWidth={1.6} />
          </span>
          <h1 className="mt-4 text-h1 text-ink-900">ورود یا ثبت‌نام</h1>
          <p className="mt-2 text-[0.8125rem] leading-[1.9] text-ink-500">
            با شمارهٔ همراه وارد شوید تا سفارش‌ها، کد رهگیری و نشانی‌هایتان همیشه در دسترس باشد. اگر حساب ندارید، خودکار ساخته می‌شود.
          </p>
        </div>
        <div className="mt-6 rounded-xl border border-line-soft bg-white p-5 shadow-soft sm:p-6">
          <OtpLogin />
        </div>
        <p className="mt-4 text-center text-[0.625rem] leading-relaxed text-ink-300">
          با ورود، شرایط استفاده و سیاست حفظ حریم خصوصی الاردشاپ را می‌پذیرید.
        </p>
        <div className="mt-8">
          <TrackPanel />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'orders', label: `سفارش‌های من${orders ? ` (${num(orders.length)})` : ''}` },
    { id: 'track', label: 'پیگیری مرسوله' },
    { id: 'addresses', label: 'نشانی‌ها' },
    { id: 'wishlist', label: 'علاقه‌مندی‌ها' },
    { id: 'profile', label: 'اطلاعات حساب' },
  ];

  return (
    <div className="container-x pt-5 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">حساب کاربری</p>
          <h1 className="text-h1 text-ink-900">سلام{user.name ? `، ${user.name.split(' ')[0]}` : ''} 🤍</h1>
          <p className="mt-1 text-[0.75rem] text-ink-400" dir="ltr">
            {normalizePhone(user.phone)}
          </p>
        </div>
        <button
          onClick={async () => {
            await logout();
            notify('از حساب خارج شدید.');
          }}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[0.75rem] text-ink-500 transition-colors hover:border-blush-300 hover:text-blush-500"
        >
          <LogOut className="size-3.5" strokeWidth={1.8} />
          خروج
        </button>
      </div>

      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-b border-line-soft">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('relative shrink-0 px-3.5 pb-2.5 pt-1 text-[0.8125rem] transition-colors', tab === t.id ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700')}
          >
            {t.label}
            {tab === t.id && <motion.span layoutId="account-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-sage-500" />}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'orders' && <OrdersPanel orders={orders} />}
        {tab === 'track' && <TrackPanel />}
        {tab === 'addresses' && <AddressesPanel />}
        {tab === 'wishlist' && <WishlistPanel />}
        {tab === 'profile' && <ProfilePanel />}
      </div>
    </div>
  );
}

/* ───────────────────────────── orders ───────────────────────────── */

function OrdersPanel({ orders }: { orders: OrderView[] | null }) {
  if (orders === null) return <div className="skeleton h-40 rounded-xl" />;
  if (orders.length === 0)
    return (
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
    );
  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const meta = ORDER_STATUS[o.status];
        const idx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(o.status);
        const tracking = o.shipments.find((s) => s.trackingCode)?.trackingCode;
        return (
          <motion.li key={o.code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-line-soft bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.75rem] font-medium text-ink-900" dir="ltr">
                    {o.code}
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[0.625rem]', meta.tone)}>{meta.label}</span>
                  {o.paymentStatus !== 'paid' && o.status !== 'cancelled' && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[0.625rem]', PAYMENT_STATUS[o.paymentStatus].tone)}>
                      {PAYMENT_STATUS[o.paymentStatus].label}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[0.6875rem] text-ink-400">
                  {date(o.createdAt)} · {num(o.totals.itemCount)} قلم · {toman(o.totals.total)}
                </p>
                {tracking && (
                  <p className="mt-1 text-[0.6875rem] text-sage-700">
                    کد رهگیری مرسوله: <span className="font-mono" dir="ltr">{tracking}</span>
                  </p>
                )}
              </div>
              <Link
                href={`/account/orders/${encodeURIComponent(o.code)}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] text-ink-600 transition-colors hover:border-sage-400 hover:text-sage-700"
              >
                {o.canPay ? 'تکمیل پرداخت' : 'جزئیات و پیگیری'}
                <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
              </Link>
            </div>
            {o.status !== 'cancelled' && o.status !== 'returned' && (
              <ol className="mt-3 flex items-center gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex flex-1 items-center gap-1">
                    <span className={cn('size-1.5 shrink-0 rounded-full', idx >= i ? 'bg-sage-500' : 'bg-cream-300')} />
                    {i < 3 && <span className={cn('h-px flex-1', idx > i ? 'bg-sage-300' : 'bg-cream-200')} />}
                  </li>
                ))}
              </ol>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ───────────────────────────── public tracking ───────────────────────────── */

function TrackPanel() {
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<
    { code: string; status: keyof typeof ORDER_STATUS; trackingCode: string | null; trackingUrl: string | null; carrier: string | null } | null
  >(null);
  const [error, setError] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    const r = await api<{ tracking: NonNullable<typeof result> }>(`/api/track?code=${encodeURIComponent(toLatinDigits(code.trim()))}`);
    setBusy(false);
    if (r.ok) setResult(r.tracking);
    else setError(r.message ?? 'سفارشی با این کد پیدا نشد.');
  };

  return (
    <div className="rounded-xl border border-line-soft bg-white p-5">
      <h2 className="text-[0.9375rem] font-semibold text-ink-900">پیگیری با شمارهٔ سفارش</h2>
      <p className="mt-1 text-[0.75rem] leading-[1.9] text-ink-500">شمارهٔ سفارش (مثل AL-1405-482193) را وارد کنید تا وضعیت مرسوله را ببینید.</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" strokeWidth={1.8} />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AL-1405-482193"
            dir="ltr"
            className="h-11 w-full rounded-xl border border-line bg-cream-100/60 ps-9 pe-3 text-[0.75rem] outline-none transition-colors focus:border-sage-400 focus:bg-white"
          />
        </div>
        <Button type="submit" size="md" loading={busy} disabled={code.trim().length < 6}>
          پیگیری
        </Button>
      </form>
      {result && (
        <div className="mt-3 space-y-1 rounded-lg bg-sage-50 px-3 py-2.5 text-[0.75rem] text-sage-700">
          <p>
            سفارش <span dir="ltr">{result.code}</span> — {ORDER_STATUS[result.status].label}
          </p>
          {result.trackingCode && (
            <p>
              {result.carrier ? `${result.carrier} · ` : ''}کد رهگیری مرسوله: <span className="font-mono" dir="ltr">{result.trackingCode}</span>
              {result.trackingUrl && (
                <a href={result.trackingUrl} target="_blank" rel="noopener noreferrer" className="ms-2 underline underline-offset-4">
                  رهگیری
                </a>
              )}
            </p>
          )}
        </div>
      )}
      {error && <div className="mt-3 rounded-lg bg-blush-100 px-3 py-2.5 text-[0.75rem] text-blush-500">{error}</div>}
    </div>
  );
}

/* ───────────────────────────── addresses ───────────────────────────── */

function AddressesPanel() {
  const notify = useUi((s) => s.notify);
  const [list, setList] = React.useState<SavedAddress[] | null>(null);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    void api<{ addresses: SavedAddress[] }>('/api/account/addresses').then((r) => setList(r.ok ? r.addresses : []));
  }, []);

  const act = async (id: number, method: 'PATCH' | 'DELETE') => {
    if (method === 'DELETE' && !window.confirm('این نشانی حذف شود؟')) return;
    const r = await api<{ addresses: SavedAddress[] }>(`/api/account/addresses/${id}`, {}, method);
    if (r.ok) setList(r.addresses);
    notify(r.message ?? '', r.ok ? 'success' : 'error');
  };

  if (list === null) return <div className="skeleton h-40 rounded-xl" />;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className={cn('rounded-xl border bg-white p-4', a.isDefault ? 'border-sage-300' : 'border-line-soft')}>
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                <MapPin className="size-3.5 text-sage-600" strokeWidth={1.8} />
                {a.title || a.receiverName}
                {a.isDefault && <span className="rounded-full bg-sage-100 px-1.5 py-0.5 text-[0.5625rem] text-sage-700">پیش‌فرض</span>}
              </p>
              <button onClick={() => act(a.id, 'DELETE')} aria-label="حذف نشانی" className="flex size-7 items-center justify-center rounded-full text-ink-300 hover:bg-blush-100 hover:text-blush-500">
                <Trash2 className="size-3.5" strokeWidth={1.8} />
              </button>
            </div>
            <p className="mt-2 text-[0.75rem] leading-[1.9] text-ink-500">
              {a.provinceName}، {a.cityName}، {a.address}
              {a.unit ? `، ${a.unit}` : ''}
              <br />
              کد پستی {a.postalCode} · {a.receiverName} — <span dir="ltr">{a.receiverPhone}</span>
            </p>
            {!a.isDefault && (
              <button onClick={() => act(a.id, 'PATCH')} className="mt-2 text-[0.6875rem] text-sage-700 underline decoration-sage-300 underline-offset-4">
                انتخاب به‌عنوان پیش‌فرض
              </button>
            )}
          </div>
        ))}
      </div>
      {list.length === 0 && !adding && <p className="rounded-xl bg-cream-100 px-4 py-6 text-center text-[0.8125rem] text-ink-400">هنوز نشانی ذخیره نکرده‌اید.</p>}
      {adding ? (
        <AddressForm
          onDone={(next) => {
            setList(next);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button variant="outline" size="md" onClick={() => setAdding(true)}>
          <Plus className="size-4" strokeWidth={2} />
          افزودن نشانی
        </Button>
      )}
    </div>
  );
}

function AddressForm({ onDone, onCancel }: { onDone: (list: SavedAddress[]) => void; onCancel: () => void }) {
  const user = useAuth((s) => s.user);
  const notify = useUi((s) => s.notify);
  const [f, setF] = React.useState({
    title: '',
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
    provinceId: '',
    cityId: '',
    postalCode: '',
    line1: '',
    line2: '',
  });
  const [provinces, setProvinces] = React.useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = React.useState<{ id: number; name: string }[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    void api<{ provinces: { id: number; name: string }[] }>('/api/geo/provinces').then((r) => r.ok && setProvinces(r.provinces));
  }, []);
  React.useEffect(() => {
    setCities([]);
    if (f.provinceId) void api<{ cities: { id: number; name: string }[] }>(`/api/geo/cities?province=${f.provinceId}`).then((r) => r.ok && setCities(r.cities));
  }, [f.provinceId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.fullName.trim().length < 3) er.fullName = 'نام گیرنده را کامل وارد کنید.';
    if (!isValidIranPhone(f.phone)) er.phone = 'شمارهٔ همراه معتبر نیست.';
    if (!f.provinceId) er.provinceId = 'استان را انتخاب کنید.';
    if (!f.cityId) er.cityId = 'شهر را انتخاب کنید.';
    if (!isValidPostal(f.postalCode)) er.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
    if (f.line1.trim().length < 10) er.line1 = 'نشانی را کامل‌تر بنویسید.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await api<{ addresses: SavedAddress[]; errors?: Record<string, string> }>('/api/account/addresses', {
      ...f,
      provinceId: Number(f.provinceId),
      cityId: Number(f.cityId),
    });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.errors ?? {});
      notify(r.message ?? 'ذخیره نشد.', 'error');
      return;
    }
    notify('نشانی ذخیره شد.', 'success');
    onDone(r.addresses);
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-line-soft bg-white p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="عنوان (مثلاً خانه، محل کار)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input label="نام و نام خانوادگی گیرنده" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={errors.fullName} />
        <Input label="شمارهٔ همراه گیرنده" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} ltr inputMode="tel" error={errors.phone} />
        <Input label="کد پستی (۱۰ رقم)" value={f.postalCode} onChange={(e) => setF({ ...f, postalCode: e.target.value })} ltr inputMode="numeric" error={errors.postalCode} />
        <Select
          label="استان"
          value={f.provinceId}
          onChange={(e) => setF({ ...f, provinceId: e.target.value, cityId: '' })}
          options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
          error={errors.provinceId}
        />
        <Select
          label="شهر"
          value={f.cityId}
          onChange={(e) => setF({ ...f, cityId: e.target.value })}
          options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
          error={errors.cityId}
          disabled={!f.provinceId}
        />
        <div className="sm:col-span-2">
          <Input label="نشانی کامل" value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} error={errors.line1} />
        </div>
        <div className="sm:col-span-2">
          <Input label="پلاک، واحد، طبقه (اختیاری)" value={f.line2} onChange={(e) => setF({ ...f, line2: e.target.value })} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" size="md" loading={busy}>
          ذخیرهٔ نشانی
        </Button>
      </div>
    </form>
  );
}

/* ───────────────────────────── wishlist ───────────────────────────── */

function WishlistPanel() {
  const notify = useUi((s) => s.notify);
  const [items, setItems] = React.useState<{ productId: number; slug: string; name: string; price: number; image: string | null }[] | null>(null);

  React.useEffect(() => {
    void api<{ items: NonNullable<typeof items> }>('/api/wishlist').then((r) => setItems(r.ok ? r.items : []));
  }, []);

  if (items === null) return <div className="skeleton h-40 rounded-xl" />;
  if (!items.length)
    return (
      <EmptyState
        variant="box"
        title="فهرست علاقه‌مندی‌ها خالی است"
        description="روی آیکون قلب در صفحهٔ هر محصول بزنید تا اینجا ذخیره شود."
        action={
          <Link href="/shop" className="inline-flex h-11 items-center rounded-xl bg-ink-900 px-5 text-[0.8125rem] text-cream-50">
            گشتی در فروشگاه
          </Link>
        }
      />
    );

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((w) => (
        <li key={w.productId} className="group overflow-hidden rounded-xl border border-line-soft bg-white">
          <Link href={`/product/${w.slug}`} className="block aspect-[4/5] bg-cream-200">
            {w.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.image} alt={w.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
          </Link>
          <div className="flex items-start justify-between gap-2 p-3">
            <div className="min-w-0">
              <Link href={`/product/${w.slug}`} className="line-clamp-1 text-[0.75rem] font-medium text-ink-900">
                {w.name}
              </Link>
              <p className="mt-0.5 text-[0.6875rem] text-ink-500">{toman(w.price)}</p>
            </div>
            <button
              aria-label="حذف از علاقه‌مندی‌ها"
              onClick={async () => {
                const r = await api<{ wishlisted: boolean }>('/api/wishlist', { productId: String(w.productId) });
                if (r.ok) {
                  setItems((list) => (list ?? []).filter((x) => x.productId !== w.productId));
                  notify('از علاقه‌مندی‌ها حذف شد.');
                }
              }}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blush-100 text-blush-500"
            >
              <Heart className="size-3.5 fill-current" strokeWidth={1.8} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────────── profile ───────────────────────────── */

function ProfilePanel() {
  const user = useAuth((s) => s.user)!;
  const setUser = useAuth((s) => s.setUser);
  const notify = useUi((s) => s.notify);
  const [name, setName] = React.useState(user.name);
  const [email, setEmail] = React.useState(user.email ?? '');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api<{ user: typeof user; errors?: Record<string, string> }>('/api/account/profile', { name, email }, 'PATCH');
    setBusy(false);
    if (!r.ok) {
      setErrors(r.errors ?? {});
      notify(r.message ?? 'ذخیره نشد.', 'error');
      return;
    }
    setErrors({});
    setUser(r.user);
    notify('اطلاعات حساب ذخیره شد.', 'success');
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      <form onSubmit={save} className="rounded-xl border border-line-soft bg-white p-4 sm:p-5">
        <p className="mb-3 flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
          <UserIcon className="size-3.5 text-sage-600" strokeWidth={1.8} />
          اطلاعات شخصی
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input label="ایمیل (اختیاری)" value={email} onChange={(e) => setEmail(e.target.value)} ltr type="email" error={errors.email} />
          <Input label="شمارهٔ همراه" value={user.phone} ltr disabled hint="شمارهٔ همراه شناسهٔ ورود شماست و قابل تغییر نیست." />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" size="md" loading={busy}>
            ذخیرهٔ تغییرات
          </Button>
        </div>
      </form>
      <div className="rounded-xl border border-line-soft bg-cream-100/70 p-4 text-[0.75rem] leading-[1.9] text-ink-500">
        <p className="flex items-center gap-1.5 font-medium text-ink-800">
          <Star className="size-3.5 text-sage-600" strokeWidth={1.8} />
          نکته
        </p>
        پس از دریافت سفارش می‌توانید در صفحهٔ هر محصول نظر و امتیاز خود را ثبت کنید؛ نظرهای خریداران با نشان «خرید تأییدشده» نمایش داده می‌شوند.
      </div>
    </div>
  );
}
