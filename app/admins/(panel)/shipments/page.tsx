import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma, ShipmentStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { ActionForm, SubmitButton } from '@/components/admin/form';
import { adminInput } from '@/components/admin/styles';
import { Badge, EmptyRow, FilterTabs, Pagination, SearchBar, Table, Td, Th, THead, Tr, paging } from '@/components/admin/table';
import { ORDER_STATUS, SHIPMENT_STATUS, type ShipmentStatusKey } from '@/lib/order-meta';
import { fDateTime, one, type SP } from '@/lib/admin/sales/shared';
import { saveShipmentAction } from '../orders/actions';

export const metadata: Metadata = { title: 'ارسال مرسوله‌ها' };

const STATUSES = Object.keys(SHIPMENT_STATUS) as ShipmentStatusKey[];

export default async function ShipmentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = one(sp.status);
  const q = one(sp.q).trim();
  const { page, skip, take } = paging(one(sp.page));

  const base: Prisma.ShipmentWhereInput = q
    ? { OR: [{ trackingCode: { contains: q } }, { order: { code: { contains: q } } }, { order: { receiverName: { contains: q } } }] }
    : {};
  const where: Prisma.ShipmentWhereInput = STATUSES.includes(status as ShipmentStatusKey) ? { ...base, status: status as ShipmentStatus } : base;

  const [rows, total, groups, awaiting] = await Promise.all([
    db.shipment.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: { order: { select: { id: true, code: true, receiverName: true, receiverPhone: true, status: true, city: { select: { name: true } } } } },
    }),
    db.shipment.count({ where }),
    db.shipment.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    db.order.count({ where: { status: 'processing', shipments: { none: {} } } }),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const href = (s: string) => `/admins/shipments?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) })}`;

  return (
    <>
      <AdminPageHeader
        title="ارسال مرسوله‌ها"
        description="کدهای رهگیری و وضعیت ارسال همهٔ سفارش‌ها"
        action={
          awaiting > 0 ? (
            <Link href="/admins/orders?status=processing" className="inline-flex h-10 items-center rounded-lg border border-blush-300 bg-blush-100 px-4 text-[0.75rem] text-blush-500">
              {new Intl.NumberFormat('fa-IR').format(awaiting)} سفارش آماده بدون مرسوله
            </Link>
          ) : undefined
        }
      />
      <FilterTabs
        active={STATUSES.includes(status as ShipmentStatusKey) ? status : 'all'}
        items={[
          { value: 'all', label: 'همه', href: href(''), count: groups.reduce((s, g) => s + g._count._all, 0) },
          ...STATUSES.map((s) => ({ value: s, label: SHIPMENT_STATUS[s].label, href: href(s), count: counts[s] ?? 0 })),
        ]}
      />
      <SearchBar action="/admins/shipments" defaultValue={q} placeholder="کد رهگیری، کد سفارش یا نام گیرنده…" hidden={{ status }} />

      <Table>
        <THead>
          <Th>سفارش</Th>
          <Th>گیرنده</Th>
          <Th>حمل‌کننده</Th>
          <Th>وضعیت</Th>
          <Th>تاریخ‌ها</Th>
          <Th className="min-w-[340px]">به‌روزرسانی سریع</Th>
        </THead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={6}>مرسوله‌ای پیدا نشد.</EmptyRow>}
          {rows.map((s) => (
            <Tr key={String(s.id)}>
              <Td>
                <Link href={`/admins/orders/${s.order.id}`} className="font-mono text-[0.75rem] font-medium text-ink-900 hover:text-sage-700" dir="ltr">
                  {s.order.code}
                </Link>
                <div className="mt-1">
                  <Badge tone={ORDER_STATUS[s.order.status].tone}>{ORDER_STATUS[s.order.status].label}</Badge>
                </div>
              </Td>
              <Td>
                <p className="text-ink-900">{s.order.receiverName}</p>
                <p className="text-[0.6875rem] text-ink-400">{s.order.city.name} · <span dir="ltr">{s.order.receiverPhone}</span></p>
              </Td>
              <Td>
                <p>{s.carrier ?? '—'}</p>
                {s.trackingUrl && (
                  <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="text-[0.6875rem] text-sage-700 hover:underline">صفحهٔ رهگیری</a>
                )}
              </Td>
              <Td>
                <Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge>
              </Td>
              <Td className="text-[0.6875rem] text-ink-500">
                <p>ارسال: {fDateTime(s.shippedAt)}</p>
                <p>تحویل: {fDateTime(s.deliveredAt)}</p>
              </Td>
              <Td>
                <ActionForm action={saveShipmentAction} className="flex flex-wrap items-center gap-1.5">
                  <input type="hidden" name="orderId" value={String(s.order.id)} />
                  <input type="hidden" name="shipmentId" value={String(s.id)} />
                  <input type="hidden" name="carrier" value={s.carrier ?? ''} />
                  <input type="hidden" name="trackingUrl" value={s.trackingUrl ?? ''} />
                  <input type="hidden" name="note" value={s.note ?? ''} />
                  <input name="trackingCode" defaultValue={s.trackingCode ?? ''} placeholder="کد رهگیری" dir="ltr" className={`${adminInput} h-8 w-36 text-[0.75rem]`} />
                  <select name="status" defaultValue={s.status} className={`${adminInput} h-8 w-36 text-[0.75rem]`}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{SHIPMENT_STATUS[st].label}</option>
                    ))}
                  </select>
                  <SubmitButton size="sm" variant="outline">ذخیره</SubmitButton>
                </ActionForm>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/shipments" params={{ status, q }} />
    </>
  );
}
