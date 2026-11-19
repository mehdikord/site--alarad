import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { adminBtn } from '@/components/admin/styles';
import { Badge, EmptyRow, Table, Td, Th, THead, Tr, fa } from '@/components/admin/table';
import { toman } from '@/lib/format';

export const metadata: Metadata = { title: 'روش‌های ارسال' };

export default async function ShippingPage() {
  const methods = await db.shippingMethod.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { provinces: { include: { province: true } }, _count: { select: { orders: true } } },
  });
  return (
    <>
      <AdminPageHeader
        title="روش‌های ارسال"
        description="هزینه، ارسال رایگان، زمان تحویل و محدودهٔ استانی هر روش"
        action={
          <Link href="/admins/shipping/new" className={adminBtn('primary')}>
            <Plus className="size-4" />
            روش جدید
          </Link>
        }
      />
      <Table>
        <THead>
          <Th>روش</Th>
          <Th>هزینه</Th>
          <Th>ارسال رایگان</Th>
          <Th>زمان تحویل</Th>
          <Th>پوشش</Th>
          <Th>سفارش‌ها</Th>
          <Th>وضعیت</Th>
        </THead>
        <tbody>
          {methods.length === 0 && <EmptyRow colSpan={7}>روش ارسالی تعریف نشده است.</EmptyRow>}
          {methods.map((m) => (
            <Tr key={String(m.id)}>
              <Td>
                <Link href={`/admins/shipping/${m.id}`} className="font-medium text-ink-900 hover:text-sage-700">{m.title}</Link>
                <p className="font-mono text-[0.625rem] text-ink-400" dir="ltr">{m.code}</p>
              </Td>
              <Td className="whitespace-nowrap">{m.cost ? toman(m.cost) : 'رایگان'}</Td>
              <Td className="whitespace-nowrap text-[0.75rem]">{m.freeShippingThreshold !== null ? `از ${toman(m.freeShippingThreshold)}` : '—'}</Td>
              <Td className="text-[0.75rem] text-ink-500">{m.eta ?? '—'}</Td>
              <Td className="max-w-[16rem] text-[0.6875rem] text-ink-500">
                {m.provinces.length === 0 ? 'سراسر کشور' : m.provinces.map((p) => p.province.name).join('، ')}
              </Td>
              <Td>{fa(m._count.orders)}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {m.isActive ? <Badge tone="bg-sage-100 text-sage-700">فعال</Badge> : <Badge>غیرفعال</Badge>}
                  {m.supportsCod && <Badge tone="bg-cream-200 text-ink-600">پرداخت در محل</Badge>}
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
