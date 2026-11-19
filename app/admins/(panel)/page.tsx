import type { Metadata } from 'next';
import Link from 'next/link';
import { Banknote, Clock, MessageSquareText, ReceiptText, ShoppingCart, UserPlus } from 'lucide-react';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { AdminPageHeader, BarChart, KpiCard, Panel, StockPill } from '@/components/admin/ui';
import { Badge, fa } from '@/components/admin/table';
import { ORDER_STATUS, type OrderStatusKey } from '@/lib/order-meta';
import { toman } from '@/lib/format';
import { fDateTime, SALE_WHERE } from '@/lib/admin/sales/shared';

export const metadata: Metadata = { title: 'داشبورد' };

const DAY = 86_400_000;
const compact = new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 });
const dayLabel = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'short' });

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { value: 'جدید', up: true } : undefined;
  const pct = ((current - previous) / previous) * 100;
  return { value: `${fa(Math.abs(Math.round(pct)))}٪ نسبت به ۳۰ روز قبل`, up: pct >= 0 };
}

export default async function DashboardPage() {
  const settings = await getSettings();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d60 = new Date(now.getTime() - 60 * DAY);
  const d14 = new Date(today.getTime() - 13 * DAY);

  const [todayAgg, cur, prev, newCustomers, prevCustomers, waiting, shippedOpen, groups, recent, chartRows, topRaw, lowStock, pendingReviews] =
    await Promise.all([
      db.order.aggregate({ where: { AND: [SALE_WHERE, { createdAt: { gte: today } }] }, _sum: { total: true }, _count: { _all: true } }),
      db.order.aggregate({ where: { AND: [SALE_WHERE, { createdAt: { gte: d30 } }] }, _sum: { total: true }, _count: { _all: true } }),
      db.order.aggregate({ where: { AND: [SALE_WHERE, { createdAt: { gte: d60, lt: d30 } }] }, _sum: { total: true }, _count: { _all: true } }),
      db.user.count({ where: { createdAt: { gte: d30 } } }),
      db.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
      db.order.count({ where: { status: 'processing' } }),
      db.order.count({ where: { status: 'shipped' } }),
      db.order.groupBy({ by: ['status'], _count: { _all: true } }),
      db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, code: true, receiverName: true, total: true, status: true, createdAt: true } }),
      db.order.findMany({ where: { AND: [SALE_WHERE, { createdAt: { gte: d14 } }] }, select: { createdAt: true, total: true } }),
      db.orderItem.groupBy({
        by: ['productId'],
        where: { productId: { not: null }, order: SALE_WHERE },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6,
      }),
      db.productVariant.findMany({
        where: { isActive: true, stock: { lte: settings.lowStockThreshold }, product: { status: 'active' } },
        orderBy: [{ stock: 'asc' }, { id: 'asc' }],
        take: 8,
        include: { product: { select: { id: true, name: true } }, color: true, size: true },
      }),
      db.review.count({ where: { status: 'pending' } }),
    ]);

  const revenue30 = cur._sum.total ?? 0;
  const orders30 = cur._count._all;
  const prevRevenue = prev._sum.total ?? 0;
  const aov = orders30 ? Math.round(revenue30 / orders30) : 0;
  const prevAov = prev._count._all ? Math.round(prevRevenue / prev._count._all) : 0;

  // 14-day chart buckets (local days)
  const buckets = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(d14.getTime() + i * DAY);
    return { start, label: dayLabel.format(start), value: 0 };
  });
  for (const r of chartRows) {
    const idx = Math.floor((r.createdAt.getTime() - d14.getTime()) / DAY);
    if (idx >= 0 && idx < 14) buckets[idx].value += r.total;
  }
  const chartTotal = buckets.reduce((s, b) => s + b.value, 0);

  const products = await db.product.findMany({
    where: { id: { in: topRaw.map((t) => t.productId!).filter(Boolean) } },
    select: { id: true, name: true },
  });
  const top = topRaw.map((t) => ({
    id: String(t.productId),
    name: products.find((p) => p.id === t.productId)?.name ?? 'محصول حذف‌شده',
    qty: t._sum.quantity ?? 0,
    revenue: t._sum.total ?? 0,
  }));

  const statusCounts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const totalOrders = groups.reduce((s, g) => s + g._count._all, 0);

  return (
    <>
      <AdminPageHeader
        title="داشبورد فروش"
        description={`نمای کلی ${settings.storeName} — ۳۰ روز اخیر`}
        action={
          <Link href="/admins/orders?status=processing" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink-900 px-4 text-[0.8125rem] text-cream-50 hover:bg-ink-800">
            <Clock className="size-4" strokeWidth={1.8} />
            {fa(waiting)} سفارش آمادهٔ ارسال
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="فروش امروز" value={toman(todayAgg._sum.total ?? 0)} hint={`${fa(todayAgg._count._all)} سفارش`} icon={<Banknote className="size-3.5" />} />
        <KpiCard label="فروش ۳۰ روز اخیر" value={toman(revenue30)} trend={change(revenue30, prevRevenue)} icon={<ShoppingCart className="size-3.5" />} delay={0.04} />
        <KpiCard label="تعداد سفارش (۳۰ روز)" value={fa(orders30)} trend={change(orders30, prev._count._all)} icon={<ReceiptText className="size-3.5" />} delay={0.08} />
        <KpiCard label="میانگین ارزش سفارش" value={toman(aov)} trend={change(aov, prevAov)} icon={<Banknote className="size-3.5" />} delay={0.12} />
        <KpiCard label="مشتریان جدید (۳۰ روز)" value={fa(newCustomers)} trend={change(newCustomers, prevCustomers)} icon={<UserPlus className="size-3.5" />} delay={0.16} />
        <KpiCard label="در انتظار آماده‌سازی" value={fa(waiting)} hint="سفارش پرداخت‌شده" icon={<Clock className="size-3.5" />} delay={0.2} />
        <KpiCard label="در مسیر تحویل" value={fa(shippedOpen)} hint="ارسال‌شده، تحویل‌نشده" icon={<ShoppingCart className="size-3.5" />} delay={0.24} />
        <KpiCard label="نظرهای در انتظار" value={fa(pendingReviews)} hint="نیازمند بررسی" icon={<MessageSquareText className="size-3.5" />} delay={0.28} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="فروش روزانه" description={`۱۴ روز اخیر · مجموع ${toman(chartTotal)}`}>
          {chartTotal === 0 ? (
            <Empty>در ۱۴ روز اخیر فروشی ثبت نشده است.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <BarChart data={buckets.map((b) => ({ label: b.label, value: b.value }))} height={180} />
              </div>
            </div>
          )}
        </Panel>

        <Panel title="وضعیت سفارش‌ها" description={`${fa(totalOrders)} سفارش در کل`}>
          {totalOrders === 0 ? (
            <Empty>هنوز سفارشی ثبت نشده است.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {(Object.keys(ORDER_STATUS) as OrderStatusKey[]).map((s) => {
                const c = statusCounts[s] ?? 0;
                return (
                  <li key={s}>
                    <Link href={`/admins/orders?status=${s}`} className="group block">
                      <div className="mb-1 flex items-center justify-between text-[0.75rem]">
                        <span className="flex items-center gap-1.5 text-ink-600 group-hover:text-ink-900">
                          <span className={`size-2 rounded-full ${ORDER_STATUS[s].dot}`} />
                          {ORDER_STATUS[s].label}
                        </span>
                        <span className="text-ink-900">{fa(c)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-cream-200">
                        <div className={`h-full rounded-full ${ORDER_STATUS[s].dot}`} style={{ width: `${(c / totalOrders) * 100}%` }} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="آخرین سفارش‌ها" action={<Link href="/admins/orders" className="text-[0.75rem] text-sage-700 hover:underline">همه</Link>}>
          {recent.length === 0 ? (
            <Empty>سفارش‌های جدید اینجا نمایش داده می‌شوند.</Empty>
          ) : (
            <ul className="divide-y divide-line-soft">
              {recent.map((o) => (
                <li key={String(o.id)}>
                  <Link href={`/admins/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-cream-50">
                    <div className="min-w-0">
                      <p className="font-mono text-[0.75rem] font-medium text-ink-900" dir="ltr">{o.code}</p>
                      <p className="truncate text-[0.6875rem] text-ink-400">{o.receiverName} · {fDateTime(o.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[0.75rem] font-medium text-ink-900">{toman(o.total)}</span>
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="پرفروش‌ترین محصولات" description="بر اساس تعداد فروخته‌شده">
          {top.length === 0 ? (
            <Empty>با ثبت اولین فروش، پرفروش‌ها اینجا می‌آیند.</Empty>
          ) : (
            <ol className="space-y-2.5">
              {top.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cream-200 text-[0.6875rem] text-ink-600">{fa(i + 1)}</span>
                  <Link href={`/admins/products/${p.id}`} className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink-800 hover:text-sage-700">{p.name}</Link>
                  <span className="shrink-0 text-[0.6875rem] text-ink-400">{fa(p.qty)} عدد · {compact.format(p.revenue)} ت</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="هشدار موجودی"
          description={`تنوع‌هایی با موجودی ${fa(settings.lowStockThreshold)} عدد یا کمتر`}
          action={<Link href="/admins/inventory" className="text-[0.75rem] text-sage-700 hover:underline">مدیریت موجودی</Link>}
        >
          {lowStock.length === 0 ? (
            <Empty>موجودی همهٔ محصولات کافی است.</Empty>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {lowStock.map((v) => (
                <li key={String(v.id)} className="flex items-center justify-between gap-2 rounded-lg border border-line-soft px-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/admins/products/${v.product.id}`} className="line-clamp-1 text-[0.75rem] text-ink-800 hover:text-sage-700">{v.product.name}</Link>
                    <p className="text-[0.625rem] text-ink-400">
                      {[v.color?.name, v.size?.label].filter(Boolean).join(' · ')} · <span dir="ltr" className="font-mono">{v.sku}</span>
                    </p>
                  </div>
                  <StockPill stock={v.stock} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-[0.75rem] text-ink-400">{children}</p>;
}
