import type { Metadata } from 'next';
import Link from 'next/link';
import type { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { Badge, EmptyRow, FilterTabs, Pagination, Table, Td, Th, THead, Tr, fa, paging } from '@/components/admin/table';
import { adminInput } from '@/components/admin/styles';
import { ORDER_STATUS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS, type OrderStatusKey, type PaymentStatusKey } from '@/lib/order-meta';
import { toman } from '@/lib/format';
import { dayEnd, dayStart, fDateTime, one, type SP } from '@/lib/admin/sales/shared';

export const metadata: Metadata = { title: 'سفارش‌ها' };

const STATUSES = Object.keys(ORDER_STATUS) as OrderStatusKey[];
const PAY = Object.keys(PAYMENT_STATUS) as PaymentStatusKey[];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = one(sp.status);
  const pay = one(sp.pay);
  const q = one(sp.q).trim();
  const from = one(sp.from);
  const to = one(sp.to);
  const { page, skip, take } = paging(one(sp.page));

  const base: Prisma.OrderWhereInput = {};
  if (PAY.includes(pay as PaymentStatusKey)) base.paymentStatus = pay as PaymentStatus;
  if (q)
    base.OR = [
      { code: { contains: q } },
      { receiverPhone: { contains: q } },
      { receiverName: { contains: q } },
      { user: { phone: { contains: q } } },
    ];
  const fromD = dayStart(from);
  const toD = dayEnd(to);
  if (fromD || toD) base.createdAt = { ...(fromD ? { gte: fromD } : {}), ...(toD ? { lte: toD } : {}) };
  const where: Prisma.OrderWhereInput = STATUSES.includes(status as OrderStatusKey) ? { ...base, status: status as OrderStatus } : base;

  const [orders, total, groups] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { province: true, city: true, user: { select: { name: true, phone: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const all = groups.reduce((s, g) => s + g._count._all, 0);
  const params = { status, pay, q, from, to };
  const href = (s: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, status: s })) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admins/orders?${qs}` : '/admins/orders';
  };

  return (
    <>
      <AdminPageHeader title="سفارش‌ها" description="پیگیری، تغییر وضعیت و ارسال سفارش‌های مشتریان" />

      <FilterTabs
        active={STATUSES.includes(status as OrderStatusKey) ? status : 'all'}
        items={[
          { value: 'all', label: 'همه', href: href(''), count: all },
          ...STATUSES.map((s) => ({ value: s, label: ORDER_STATUS[s].label, href: href(s), count: counts[s] ?? 0 })),
        ]}
      />

      <form action="/admins/orders" method="get" className="mb-4 grid gap-2 rounded-xl border border-line-soft bg-white p-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="کد سفارش، نام یا موبایل…" className={adminInput} />
        <select name="pay" defaultValue={pay} className={adminInput}>
          <option value="">همهٔ وضعیت‌های پرداخت</option>
          {PAY.map((p) => (
            <option key={p} value={p}>{PAYMENT_STATUS[p].label}</option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={from} className={adminInput} aria-label="از تاریخ" title="از تاریخ" />
        <input type="date" name="to" defaultValue={to} className={adminInput} aria-label="تا تاریخ" title="تا تاریخ" />
        <div className="flex gap-2">
          <button className="h-10 flex-1 rounded-lg bg-ink-900 px-4 text-[0.8125rem] text-cream-50 hover:bg-ink-800">فیلتر</button>
          {(q || pay || from || to) && (
            <Link href={status ? `/admins/orders?status=${status}` : '/admins/orders'} className="flex h-10 items-center rounded-lg border border-line px-3 text-[0.75rem] text-ink-500 hover:bg-cream-100">
              پاک کردن
            </Link>
          )}
        </div>
      </form>

      <Table>
        <THead>
          <Th>کد سفارش</Th>
          <Th>مشتری</Th>
          <Th>مقصد</Th>
          <Th>اقلام</Th>
          <Th>مبلغ</Th>
          <Th>پرداخت</Th>
          <Th>وضعیت</Th>
          <Th>تاریخ</Th>
        </THead>
        <tbody>
          {orders.length === 0 && <EmptyRow colSpan={8}>سفارشی با این فیلترها پیدا نشد.</EmptyRow>}
          {orders.map((o) => (
            <Tr key={String(o.id)}>
              <Td>
                <Link href={`/admins/orders/${o.id}`} className="font-mono text-[0.75rem] font-medium text-ink-900 hover:text-sage-700" dir="ltr">
                  {o.code}
                </Link>
              </Td>
              <Td>
                <p className="text-ink-900">{o.receiverName}</p>
                <p className="text-[0.6875rem] text-ink-400" dir="ltr">{o.receiverPhone}</p>
              </Td>
              <Td className="text-[0.75rem] text-ink-500">{o.province.name}، {o.city.name}</Td>
              <Td>{fa(o.itemCount)}</Td>
              <Td className="whitespace-nowrap font-medium text-ink-900">{toman(o.total)}</Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge>
                  <span className="text-[0.625rem] text-ink-400">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</span>
                </div>
              </Td>
              <Td>
                <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
              </Td>
              <Td className="whitespace-nowrap text-[0.75rem] text-ink-500">{fDateTime(o.createdAt)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/orders" params={params} />
    </>
  );
}
