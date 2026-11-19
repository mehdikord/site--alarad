import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { db, toId } from '@/lib/db';
import { AdminPageHeader, KpiCard, Panel } from '@/components/admin/ui';
import { Badge, fa } from '@/components/admin/table';
import { UserForm } from '@/components/admin/sales/user-form';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/order-meta';
import { toman } from '@/lib/format';
import { fDate, fDateTime, SALE_WHERE } from '@/lib/admin/sales/shared';
import { updateUserAction } from '../actions';

export const metadata: Metadata = { title: 'جزئیات کاربر' };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = toId((await params).id);
  if (!userId) notFound();
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      addresses: { include: { province: true, city: true }, orderBy: [{ isDefault: 'desc' }, { id: 'desc' }] },
      orders: { orderBy: { createdAt: 'desc' }, take: 50 },
      _count: { select: { orders: true, reviews: true, wishlists: true } },
    },
  });
  if (!user) notFound();
  const spent = await db.order.aggregate({ where: { AND: [SALE_WHERE, { userId }] }, _sum: { total: true }, _count: { _all: true } });

  return (
    <>
      <Link href="/admins/users" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به کاربران</Link>
      <AdminPageHeader
        title={user.name || 'کاربر بدون نام'}
        description={`${user.phone} · عضویت از ${fDate(user.createdAt)} · آخرین ورود ${fDate(user.lastLoginAt)}`}
        action={user.isActive ? <Badge tone="bg-sage-100 text-sage-700">فعال</Badge> : <Badge>غیرفعال</Badge>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="کل سفارش‌ها" value={fa(user._count.orders)} />
        <KpiCard label="سفارش‌های موفق" value={fa(spent._count._all)} />
        <KpiCard label="مجموع خرید" value={toman(spent._sum.total ?? 0)} />
        <KpiCard label="نظر / علاقه‌مندی" value={`${fa(user._count.reviews)} / ${fa(user._count.wishlists)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel title="ویرایش اطلاعات">
            <UserForm
              action={updateUserAction}
              user={{ id: Number(user.id), name: user.name ?? '', phone: user.phone, email: user.email ?? '', isActive: user.isActive }}
              submit="ذخیرهٔ تغییرات"
            />
          </Panel>

          <Panel title="سفارش‌های کاربر">
            {user.orders.length === 0 ? (
              <p className="py-6 text-center text-[0.75rem] text-ink-400">این کاربر هنوز سفارشی ثبت نکرده است.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {user.orders.map((o) => (
                  <li key={String(o.id)}>
                    <Link href={`/admins/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-cream-50">
                      <div>
                        <p className="font-mono text-[0.75rem] font-medium text-ink-900" dir="ltr">{o.code}</p>
                        <p className="text-[0.6875rem] text-ink-400">{fDateTime(o.createdAt)} · {fa(o.itemCount)} قلم</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.75rem] font-medium text-ink-900">{toman(o.total)}</span>
                        <Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge>
                        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="نشانی‌ها">
          {user.addresses.length === 0 ? (
            <p className="py-6 text-center text-[0.75rem] text-ink-400">نشانی ذخیره‌شده‌ای ندارد.</p>
          ) : (
            <ul className="space-y-3">
              {user.addresses.map((a) => (
                <li key={String(a.id)} className="rounded-lg border border-line-soft p-3 text-[0.75rem] leading-6 text-ink-600">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-ink-900">
                    <MapPin className="size-3.5 text-sage-600" strokeWidth={1.8} />
                    {a.title || 'نشانی'}
                    {a.isDefault && <Badge tone="bg-sage-100 text-sage-700">پیش‌فرض</Badge>}
                  </p>
                  <p>{a.receiverName} — <span dir="ltr">{a.receiverPhone}</span></p>
                  <p>{a.province.name}، {a.city.name}، {a.address}{a.unit ? `، ${a.unit}` : ''}</p>
                  <p>کد پستی: <span dir="ltr">{a.postalCode}</span></p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
