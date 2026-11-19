import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ActionForm, SubmitButton, TextField, Toggle } from '@/components/admin/form';
import { Badge, Table, Td, Th, THead, Tr } from '@/components/admin/table';
import { fDate, fDateTime } from '@/lib/admin/sales/shared';
import { changeMyPasswordAction, createAdminAction } from './actions';

export const metadata: Metadata = { title: 'مدیران سیستم' };

export default async function AdminsPage() {
  const me = await requireAdmin();
  const admins = await db.admin.findMany({ orderBy: { id: 'asc' } });
  return (
    <>
      <AdminPageHeader title="مدیران سیستم" description="ورود به پنل با شمارهٔ موبایل و رمز عبور انجام می‌شود" />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Table>
          <THead>
            <Th>نام</Th>
            <Th>موبایل</Th>
            <Th>وضعیت</Th>
            <Th>آخرین ورود</Th>
            <Th>ایجاد</Th>
          </THead>
          <tbody>
            {admins.map((a) => (
              <Tr key={String(a.id)}>
                <Td>
                  <Link href={`/admins/admins/${a.id}`} className="font-medium text-ink-900 hover:text-sage-700">{a.name}</Link>
                  {a.id === me.id && <Badge tone="bg-cream-200 text-ink-600" className="ms-1.5">شما</Badge>}
                </Td>
                <Td><span dir="ltr">{a.phone}</span></Td>
                <Td>{a.isActive ? <Badge tone="bg-sage-100 text-sage-700">فعال</Badge> : <Badge>غیرفعال</Badge>}</Td>
                <Td className="text-[0.75rem] text-ink-500">{fDateTime(a.lastLoginAt)}</Td>
                <Td className="text-[0.75rem] text-ink-500">{fDate(a.createdAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        <div className="space-y-4">
          <Panel title="افزودن مدیر">
            <ActionForm action={createAdminAction} className="space-y-3" resetOnSuccess>
              <TextField name="name" label="نام" required />
              <TextField name="phone" label="شمارهٔ موبایل" ltr inputMode="tel" placeholder="09xxxxxxxxx" required />
              <TextField name="password" type="password" label="رمز عبور" ltr autoComplete="new-password" hint="حداقل ۸ کاراکتر" required />
              <Toggle name="isActive" label="فعال" defaultChecked />
              <SubmitButton size="sm">افزودن مدیر</SubmitButton>
            </ActionForm>
          </Panel>
          <Panel title="تغییر رمز عبور من">
            <ActionForm action={changeMyPasswordAction} className="space-y-3" resetOnSuccess>
              <TextField name="current" type="password" label="رمز فعلی" ltr autoComplete="current-password" required />
              <TextField name="next" type="password" label="رمز جدید" ltr autoComplete="new-password" required />
              <TextField name="confirm" type="password" label="تکرار رمز جدید" ltr autoComplete="new-password" required />
              <SubmitButton size="sm" variant="outline">تغییر رمز</SubmitButton>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
