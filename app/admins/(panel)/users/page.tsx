import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { UserPlus } from 'lucide-react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { adminBtn } from '@/components/admin/styles';
import { Badge, EmptyRow, FilterTabs, Pagination, SearchBar, Table, Td, Th, THead, Tr, fa, paging } from '@/components/admin/table';
import { toman } from '@/lib/format';
import { fDate, one, SALE_WHERE, type SP } from '@/lib/admin/sales/shared';

export const metadata: Metadata = { title: 'کاربران' };

export default async function UsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const state = one(sp.state);
  const { page, skip, take } = paging(one(sp.page));

  const base: Prisma.UserWhereInput = q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] } : {};
  const where: Prisma.UserWhereInput = state === 'active' ? { ...base, isActive: true } : state === 'inactive' ? { ...base, isActive: false } : base;

  const [users, total, activeCount, inactiveCount] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { _count: { select: { orders: true } } } }),
    db.user.count({ where }),
    db.user.count({ where: { ...base, isActive: true } }),
    db.user.count({ where: { ...base, isActive: false } }),
  ]);
  const spent = await db.order.groupBy({
    by: ['userId'],
    where: { AND: [SALE_WHERE, { userId: { in: users.map((u) => u.id) } }] },
    _sum: { total: true },
  });
  const spentBy = new Map(spent.map((s) => [String(s.userId), s._sum.total ?? 0]));
  const href = (s: string) => `/admins/users?${new URLSearchParams({ ...(s ? { state: s } : {}), ...(q ? { q } : {}) })}`;

  return (
    <>
      <AdminPageHeader
        title="کاربران"
        description="مشتریان ثبت‌نام‌کرده با شمارهٔ موبایل"
        action={
          <Link href="/admins/users/new" className={adminBtn('primary')}>
            <UserPlus className="size-4" strokeWidth={1.8} />
            کاربر جدید
          </Link>
        }
      />
      <FilterTabs
        active={state || 'all'}
        items={[
          { value: 'all', label: 'همه', href: href(''), count: activeCount + inactiveCount },
          { value: 'active', label: 'فعال', href: href('active'), count: activeCount },
          { value: 'inactive', label: 'غیرفعال', href: href('inactive'), count: inactiveCount },
        ]}
      />
      <SearchBar action="/admins/users" defaultValue={q} placeholder="نام، موبایل یا ایمیل…" hidden={{ state }} />
      <Table>
        <THead>
          <Th>کاربر</Th>
          <Th>موبایل</Th>
          <Th>سفارش‌ها</Th>
          <Th>مجموع خرید</Th>
          <Th>وضعیت</Th>
          <Th>عضویت</Th>
          <Th>آخرین ورود</Th>
        </THead>
        <tbody>
          {users.length === 0 && <EmptyRow colSpan={7}>کاربری پیدا نشد.</EmptyRow>}
          {users.map((u) => (
            <Tr key={String(u.id)}>
              <Td>
                <Link href={`/admins/users/${u.id}`} className="font-medium text-ink-900 hover:text-sage-700">
                  {u.name || 'بدون نام'}
                </Link>
                {u.email && <p className="text-[0.6875rem] text-ink-400" dir="ltr">{u.email}</p>}
              </Td>
              <Td><span dir="ltr">{u.phone}</span></Td>
              <Td>{fa(u._count.orders)}</Td>
              <Td className="whitespace-nowrap">{toman(spentBy.get(String(u.id)) ?? 0)}</Td>
              <Td>{u.isActive ? <Badge tone="bg-sage-100 text-sage-700">فعال</Badge> : <Badge>غیرفعال</Badge>}</Td>
              <Td className="text-[0.75rem] text-ink-500">{fDate(u.createdAt)}</Td>
              <Td className="text-[0.75rem] text-ink-500">{fDate(u.lastLoginAt)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/users" params={{ q, state }} />
    </>
  );
}
