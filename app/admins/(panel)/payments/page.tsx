import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma, TransactionStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { AdminPageHeader, KpiCard } from '@/components/admin/ui';
import { adminInput } from '@/components/admin/styles';
import { Badge, EmptyRow, FilterTabs, Pagination, Table, Td, Th, THead, Tr, fa, paging } from '@/components/admin/table';
import { GATEWAY_LABEL, TRANSACTION_STATUS, type TransactionStatusKey } from '@/lib/order-meta';
import { toman } from '@/lib/format';
import { fDateTime, one, type SP } from '@/lib/admin/sales/shared';

export const metadata: Metadata = { title: 'تراکنش‌های پرداخت' };

const STATUSES = Object.keys(TRANSACTION_STATUS) as TransactionStatusKey[];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = one(sp.status);
  const gateway = one(sp.gateway);
  const q = one(sp.q).trim();
  const { page, skip, take } = paging(one(sp.page), 25);

  const base: Prisma.PaymentWhereInput = {};
  if (gateway) base.gateway = gateway;
  if (q) base.OR = [{ order: { code: { contains: q } } }, { authority: { contains: q } }, { refId: { contains: q } }];
  const where: Prisma.PaymentWhereInput = STATUSES.includes(status as TransactionStatusKey) ? { ...base, status: status as TransactionStatus } : base;

  const [rows, total, groups, gateways, paidAgg] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { order: { select: { id: true, code: true, receiverName: true } }, user: { select: { phone: true } } },
    }),
    db.payment.count({ where }),
    db.payment.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    db.payment.groupBy({ by: ['gateway'], _count: { _all: true } }),
    db.payment.aggregate({ where: { ...base, status: 'paid' }, _sum: { amount: true }, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const all = groups.reduce((s, g) => s + g._count._all, 0);
  const href = (s: string) => `/admins/payments?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(gateway ? { gateway } : {}), ...(q ? { q } : {}) })}`;

  return (
    <>
      <AdminPageHeader title="تراکنش‌های پرداخت" description="همهٔ تلاش‌های پرداخت آنلاین و نتیجهٔ تأیید درگاه" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="جمع پرداخت‌های موفق" value={toman(paidAgg._sum.amount ?? 0)} hint={`${fa(paidAgg._count._all)} تراکنش`} />
        <KpiCard label="کل تراکنش‌ها" value={fa(all)} />
        <KpiCard label="نرخ موفقیت" value={all ? `${fa(Math.round(((counts.paid ?? 0) / all) * 100))}٪` : '—'} />
      </div>
      <FilterTabs
        active={STATUSES.includes(status as TransactionStatusKey) ? status : 'all'}
        items={[
          { value: 'all', label: 'همه', href: href(''), count: all },
          ...STATUSES.map((s) => ({ value: s, label: TRANSACTION_STATUS[s].label, href: href(s), count: counts[s] ?? 0 })),
        ]}
      />
      <form action="/admins/payments" method="get" className="mb-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="کد سفارش، Authority یا کد پیگیری…" className={`${adminInput} min-w-0 flex-1 sm:max-w-sm`} />
        <select name="gateway" defaultValue={gateway} className={`${adminInput} w-44`}>
          <option value="">همهٔ درگاه‌ها</option>
          {gateways.map((g) => (
            <option key={g.gateway} value={g.gateway}>{GATEWAY_LABEL[g.gateway] ?? g.gateway}</option>
          ))}
        </select>
        <button className="h-10 rounded-lg bg-ink-900 px-4 text-[0.8125rem] text-cream-50 hover:bg-ink-800">فیلتر</button>
      </form>

      <Table>
        <THead>
          <Th>#</Th>
          <Th>سفارش</Th>
          <Th>درگاه</Th>
          <Th>مبلغ</Th>
          <Th>وضعیت</Th>
          <Th>Authority / کد پیگیری</Th>
          <Th>کارت</Th>
          <Th>تاریخ</Th>
        </THead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={8}>تراکنشی پیدا نشد.</EmptyRow>}
          {rows.map((p) => (
            <Tr key={String(p.id)}>
              <Td className="text-ink-400">{fa(Number(p.id))}</Td>
              <Td>
                <Link href={`/admins/orders/${p.order.id}`} className="font-mono text-[0.75rem] font-medium text-ink-900 hover:text-sage-700" dir="ltr">
                  {p.order.code}
                </Link>
                <p className="text-[0.6875rem] text-ink-400">{p.order.receiverName}</p>
              </Td>
              <Td>{GATEWAY_LABEL[p.gateway] ?? p.gateway}</Td>
              <Td className="whitespace-nowrap font-medium text-ink-900">{toman(p.amount)}</Td>
              <Td>
                <Badge tone={TRANSACTION_STATUS[p.status].tone}>{TRANSACTION_STATUS[p.status].label}</Badge>
                {p.failureReason && <p className="mt-0.5 max-w-[12rem] text-[0.625rem] text-blush-500">{p.failureReason}</p>}
              </Td>
              <Td>
                <p className="max-w-[11rem] truncate font-mono text-[0.6875rem] text-ink-500" dir="ltr" title={p.authority ?? ''}>{p.authority ?? '—'}</p>
                <p className="font-mono text-[0.6875rem] text-ink-900" dir="ltr">{p.refId ?? ''}</p>
              </Td>
              <Td className="font-mono text-[0.6875rem]" ><span dir="ltr">{p.cardPan ?? '—'}</span></Td>
              <Td className="whitespace-nowrap text-[0.6875rem] text-ink-500">
                {fDateTime(p.createdAt)}
                {p.paidAt && <p className="text-sage-700">پرداخت: {fDateTime(p.paidAt)}</p>}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/payments" params={{ status, gateway, q }} />
    </>
  );
}
