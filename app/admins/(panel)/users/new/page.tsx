import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { UserForm } from '@/components/admin/sales/user-form';
import { createUserAction } from '../actions';

export const metadata: Metadata = { title: 'کاربر جدید' };

export default function NewUserPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/admins/users" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به کاربران</Link>
      <AdminPageHeader title="ساخت کاربر جدید" description="کاربر با همین شماره می‌تواند با کد پیامکی وارد شود." />
      <Panel title="اطلاعات کاربر">
        <UserForm action={createUserAction} submit="ساخت کاربر" />
      </Panel>
    </div>
  );
}
