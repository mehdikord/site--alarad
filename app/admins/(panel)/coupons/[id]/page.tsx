import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ConfirmAction } from '@/components/admin/form';
import { fa } from '@/components/admin/table';
import { CouponForm } from '@/components/admin/sales/coupon-form';
import { toman } from '@/lib/format';
import { fDateTime, toLocalInput } from '@/lib/admin/sales/shared';
import { deleteCouponAction, updateCouponAction } from '../actions';

export const metadata: Metadata = { title: 'ویرایش کد تخفیف' };

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const couponId = toId((await params).id);
  if (!couponId) notFound();
  const c = await db.coupon.findUnique({
    where: { id: couponId },
    include: {
      usages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { order: { select: { id: true, code: true } }, user: { select: { id: true, name: true, phone: true } } },
      },
    },
  });
  if (!c) notFound();
  const totalDiscount = await db.couponUsage.aggregate({ where: { couponId }, _sum: { amount: true } });

  return (
    <>
      <Link href="/admins/coupons" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به کدهای تخفیف</Link>
      <AdminPageHeader
        title={`کد ${c.code}`}
        description={`${fa(c.usedCount)} بار استفاده · مجموع تخفیف ${toman(totalDiscount._sum.amount ?? 0)}`}
        action={<ConfirmAction action={deleteCouponAction} fields={{ id: String(c.id) }} confirm="این کد تخفیف حذف شود؟" label="حذف کد" size="md" />}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Panel title="مشخصات کد">
          <CouponForm
            action={updateCouponAction}
            submit="ذخیرهٔ تغییرات"
            values={{
              id: Number(c.id),
              code: c.code,
              title: c.title,
              type: c.type,
              value: c.value,
              maxDiscount: c.maxDiscount ?? '',
              minOrderAmount: c.minOrderAmount ?? '',
              usageLimit: c.usageLimit ?? '',
              perUserLimit: c.perUserLimit ?? '',
              startsAt: toLocalInput(c.startsAt),
              expiresAt: toLocalInput(c.expiresAt),
              isActive: c.isActive,
            }}
          />
        </Panel>
        <Panel title="سابقهٔ استفاده">
          {c.usages.length === 0 ? (
            <p className="py-6 text-center text-[0.75rem] text-ink-400">هنوز استفاده نشده است.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {c.usages.map((u) => (
                <li key={String(u.id)} className="flex items-center justify-between gap-2 py-2 text-[0.75rem]">
                  <div>
                    <Link href={`/admins/orders/${u.order.id}`} className="font-mono text-ink-900 hover:text-sage-700" dir="ltr">{u.order.code}</Link>
                    <p className="text-[0.625rem] text-ink-400">
                      {u.user ? (u.user.name || u.user.phone) : 'مهمان'} · {fDateTime(u.createdAt)}
                    </p>
                  </div>
                  <span className="text-sage-700">− {toman(u.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
