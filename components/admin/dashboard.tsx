'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Boxes, Coins, Package, ReceiptText, TrendingUp, Users } from 'lucide-react';
import { PRODUCTS } from '@/lib/data/products';
import { useOrders, useCatalog, useHydrated } from '@/lib/store';
import { STATUS_META } from '@/lib/store/orders';
import { date, num, percent, toman } from '@/lib/format';
import { AdminPageHeader, BarChart, KpiCard, Panel, Sparkline, StockPill } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

const WEEK = [
  { label: 'شنبه', value: 5_120_000 },
  { label: 'یکشنبه', value: 3_940_000 },
  { label: 'دوشنبه', value: 6_780_000 },
  { label: 'سه‌شنبه', value: 4_310_000 },
  { label: 'چهارشنبه', value: 7_250_000 },
  { label: 'پنجشنبه', value: 9_640_000 },
  { label: 'جمعه', value: 8_120_000 },
];

export function AdminDashboard() {
  const hydrated = useHydrated();
  const orders = useOrders((s) => s.orders);
  const stockMap = useCatalog((s) => s.stock);
  const patches = useCatalog((s) => s.patches);
  const custom = useCatalog((s) => s.custom);

  const all = [...custom, ...PRODUCTS];
  const liveStock = (pid: string) => {
    const p = all.find((x) => x.id === pid);
    if (!p) return 0;
    return p.variants.reduce((sum, v) => sum + (stockMap[v.id] ?? v.stock), 0);
  };

  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totals.grandTotal, 0);
  const openOrders = orders.filter((o) => o.status === 'processing' || o.status === 'pending');
  const lowStock = all
    .map((p) => ({
      product: p,
      variants: p.variants.filter((v) => (stockMap[v.id] ?? v.stock) <= 5),
    }))
    .filter((x) => x.variants.length > 0)
    .slice(0, 6);

  const topProducts = [...PRODUCTS]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5)
    .map((p, i) => ({ ...p, sold: [214, 187, 163, 121, 98][i] }));

  return (
    <>
      <AdminPageHeader
        title="داشبورد فروش"
        description={`آخرین به‌روزرسانی: امروز · ${num(orders.length)} سفارش ثبت‌شده`}
        action={
          <Link
            href="/admin/products"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 text-[0.75rem] text-cream-50 transition-colors hover:bg-ink-800"
          >
            <Package className="size-3.5" strokeWidth={1.8} />
            افزودن محصول
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="فروش هفته"
          value={hydrated ? toman(45_160_000) : '—'}
          trend={{ value: '۱۲٪', up: true }}
          hint="نسبت به هفتهٔ قبل"
          icon={<Coins className="size-3.5" strokeWidth={1.8} />}
          delay={0}
        />
        <KpiCard
          label="سفارش‌های باز"
          value={hydrated ? num(openOrders.length) : '—'}
          hint="در انتظار آماده‌سازی"
          icon={<ReceiptText className="size-3.5" strokeWidth={1.8} />}
          delay={0.05}
        />
        <KpiCard
          label="درآمد کل ثبت‌شده"
          value={hydrated ? toman(revenue) : '—'}
          trend={{ value: '۸٪', up: true }}
          hint="از ابتدای ماه"
          icon={<TrendingUp className="size-3.5" strokeWidth={1.8} />}
          delay={0.1}
        />
        <KpiCard
          label="کالاهای کم‌موجود"
          value={hydrated ? num(lowStock.reduce((s, x) => s + x.variants.length, 0)) : '—'}
          hint={`از ${num(all.length)} محصول`}
          icon={<Boxes className="size-3.5" strokeWidth={1.8} />}
          delay={0.15}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="فروش هفت روز گذشته"
          description="مبالغ به تومان — بدون مالیات"
          action={
            <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[0.625rem] text-sage-700">
              میانگین روزانه {toman(6_451_000)}
            </span>
          }
        >
          <BarChart data={WEEK} height={160} />
        </Panel>

        <Panel title="سفارش‌های اخیر" action={<Link href="/admin/orders" className="text-[0.6875rem] text-sage-700">همه</Link>}>
          {!hydrated ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : orders.length ? (
            <ul className="divide-y divide-line-soft">
              {orders.slice(0, 5).map((o) => (
                <li key={o.code} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[0.6875rem] text-ink-900" dir="ltr">{o.code}</p>
                    <p className="text-[0.5625rem] text-ink-400">
                      {o.address.fullName} · {date(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[0.5625rem]', STATUS_META[o.status].tone)}>
                      {STATUS_META[o.status].label}
                    </span>
                    <span className="text-[0.6875rem] text-ink-800">{num(o.totals.grandTotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[0.75rem] text-ink-400">هنوز سفارشی ثبت نشده است.</p>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="پرفروش‌ترین محصولات" description="بر اساس تعداد فروش این ماه">
          <ul className="divide-y divide-line-soft">
            {topProducts.map((p, i) => (
              <li key={p.slug} className="flex items-center gap-3 py-2.5">
                <span className="w-4 text-[0.625rem] text-ink-300">{num(i + 1)}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/${p.shots[0]}__${p.colors[0]}.webp`} alt="" className="size-9 rounded-md object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[0.75rem] text-ink-900">{p.name}</p>
                  <p className="text-[0.5625rem] text-ink-400">{toman(p.price)}</p>
                </div>
                <div className="w-16 shrink-0">
                  <Sparkline points={[3, 5, 4, 7, 6, 9, 11].map((n) => n * (6 - i))} />
                </div>
                <span className="w-10 shrink-0 text-end text-[0.6875rem] text-ink-700">{num(p.sold)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="هشدار موجودی"
          description="محصولاتی که باید شارژ شوند"
          action={<Link href="/admin/inventory" className="text-[0.6875rem] text-sage-700">مدیریت انبار</Link>}
        >
          {lowStock.length ? (
            <ul className="divide-y divide-line-soft">
              {lowStock.map(({ product, variants }) => (
                <li key={product.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[0.75rem] text-ink-900">{product.name}</p>
                    <p className="text-[0.5625rem] text-ink-400">
                      {num(variants.length)} واریانت نیاز به شارژ · مجموع {num(liveStock(product.id))}
                    </p>
                  </div>
                  <Link
                    href="/admin/inventory"
                    className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-1 text-[0.5625rem] text-ink-600 hover:border-sage-400"
                  >
                    شارژ
                    <ArrowLeft className="size-2.5" strokeWidth={2.4} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[0.75rem] text-sage-700">همهٔ موجودی‌ها سالم است.</p>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'نرخ تبدیل', value: '۳٫۸٪', hint: 'بازدید به خرید' },
          { label: 'میانگین سبد', value: hydrated ? toman(478_000) : '—', hint: 'به ازای هر سفارش' },
          { label: 'مشتریان بازگشتی', value: '۴۲٪', hint: 'خرید دوم به بعد' },
          { label: 'مرجوعی', value: percent(1.8), hint: 'از کل سفارش‌ها' },
        ].map((s, i) => (
          <KpiCard key={s.label} label={s.label} value={s.value} hint={s.hint} delay={i * 0.04} icon={<Users className="size-3.5" strokeWidth={1.8} />} />
        ))}
      </div>
    </>
  );
}
