import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { adminBtn } from '@/components/admin/styles';
import { Badge, EmptyRow, SearchBar, Table, Td, Th, THead, Tr, fa } from '@/components/admin/table';
import { toman } from '@/lib/format';
import { fDate, one, type SP } from '@/lib/admin/sales/shared';

export const metadata: Metadata = { title: 'کدهای تخفیف' };

export default async function CouponsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const q = one((await searchParams).q).trim().toUpperCase();
  const coupons = await db.coupon.findMany({
    where: q ? { OR: [{ code: { contains: q } }, { title: { contains: q } }] } : {},
    orderBy: { createdAt: 'desc' },
  });
  const now = new Date();
  const stateOf = (c: (typeof coupons)[number]) => {
    if (!c.isActive) return { label: 'غیرفعال', tone: 'bg-cream-300 text-ink-500' };
    if (c.expiresAt && c.expiresAt < now) return { label: 'منقضی', tone: 'bg-blush-100 text-blush-500' };
    if (c.startsAt && c.startsAt > now) return { label: 'زمان‌بندی‌شده', tone: 'bg-cream-200 text-ink-600' };
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: 'تمام‌شده', tone: 'bg-blush-100 text-blush-500' };
    return { label: 'فعال', tone: 'bg-sage-100 text-sage-700' };
  };

  return (
    <>
      <AdminPageHeader
        title="کدهای تخفیف"
        description="کدهای درصدی و مبلغ ثابت با محدودیت زمان و تعداد استفاده"
        action={
          <Link href="/admins/coupons/new" className={adminBtn('primary')}>
            <Plus className="size-4" />
            کد جدید
          </Link>
        }
      />
      <SearchBar action="/admins/coupons" defaultValue={q} placeholder="کد یا عنوان…" />
      <Table>
        <THead>
          <Th>کد</Th>
          <Th>عنوان</Th>
          <Th>تخفیف</Th>
          <Th>شرایط</Th>
          <Th>استفاده</Th>
          <Th>اعتبار</Th>
          <Th>وضعیت</Th>
        </THead>
        <tbody>
          {coupons.length === 0 && <EmptyRow colSpan={7}>کد تخفیفی ثبت نشده است.</EmptyRow>}
          {coupons.map((c) => {
            const st = stateOf(c);
            return (
              <Tr key={String(c.id)}>
                <Td>
                  <Link href={`/admins/coupons/${c.id}`} className="font-mono text-[0.75rem] font-semibold text-ink-900 hover:text-sage-700" dir="ltr">{c.code}</Link>
                </Td>
                <Td>{c.title}</Td>
                <Td className="whitespace-nowrap">
                  {c.type === 'percent' ? `${fa(c.value)}٪` : toman(c.value)}
                  {c.maxDiscount ? <p className="text-[0.625rem] text-ink-400">سقف {toman(c.maxDiscount)}</p> : null}
                </Td>
                <Td className="text-[0.6875rem] text-ink-500">
                  {c.minOrderAmount ? `حداقل ${toman(c.minOrderAmount)}` : 'بدون حداقل'}
                  {c.perUserLimit ? <p>هر کاربر {fa(c.perUserLimit)} بار</p> : null}
                </Td>
                <Td>{fa(c.usedCount)}{c.usageLimit !== null ? ` / ${fa(c.usageLimit)}` : ''}</Td>
                <Td className="text-[0.6875rem] text-ink-500">
                  {c.startsAt ? `از ${fDate(c.startsAt)}` : 'از اکنون'}
                  <p>{c.expiresAt ? `تا ${fDate(c.expiresAt)}` : 'بدون انقضا'}</p>
                </Td>
                <Td><Badge tone={st.tone}>{st.label}</Badge></Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
