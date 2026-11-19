import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { db } from '@/lib/db';
import { AdminPageHeader } from '@/components/admin/ui';
import { ConfirmAction } from '@/components/admin/form';
import { adminBtn } from '@/components/admin/styles';
import { Badge, EmptyRow, Pagination, SearchBar, Table, Td, Th, THead, Tr, fa, paging } from '@/components/admin/table';
import { fDateTime, one, type SP } from '@/lib/admin/sales/shared';
import { deleteSubscriberAction, toggleSubscriberAction } from './actions';

export const metadata: Metadata = { title: 'خبرنامه' };

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const { page, skip, take } = paging(one(sp.page), 30);
  const where = q ? { contact: { contains: q } } : {};
  const [rows, total, active] = await Promise.all([
    db.newsletterSubscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="خبرنامه"
        description={`${fa(active)} مشترک فعال`}
        action={
          <a href="/api/admin/newsletter/export" className={adminBtn('outline')}>
            <Download className="size-4" strokeWidth={1.8} />
            خروجی CSV
          </a>
        }
      />
      <SearchBar action="/admins/newsletter" defaultValue={q} placeholder="ایمیل یا شماره…" />
      <Table>
        <THead>
          <Th>ایمیل / موبایل</Th>
          <Th>وضعیت</Th>
          <Th>تاریخ عضویت</Th>
          <Th className="text-end">عملیات</Th>
        </THead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={4}>هنوز مشترکی ندارید.</EmptyRow>}
          {rows.map((s) => (
            <Tr key={String(s.id)}>
              <Td><span dir="ltr">{s.contact}</span></Td>
              <Td>{s.isActive ? <Badge tone="bg-sage-100 text-sage-700">فعال</Badge> : <Badge>لغو اشتراک</Badge>}</Td>
              <Td className="text-[0.75rem] text-ink-500">{fDateTime(s.createdAt)}</Td>
              <Td className="text-end">
                <div className="flex justify-end gap-1.5">
                  <ConfirmAction action={toggleSubscriberAction} fields={{ id: String(s.id) }} confirm={s.isActive ? 'اشتراک غیرفعال شود؟' : 'اشتراک فعال شود؟'} variant="outline" label={s.isActive ? 'غیرفعال' : 'فعال'} />
                  <ConfirmAction action={deleteSubscriberAction} fields={{ id: String(s.id) }} confirm="این مشترک حذف شود؟" label="حذف" />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={Math.ceil(total / take)} total={total} basePath="/admins/newsletter" params={{ q }} />
    </>
  );
}
