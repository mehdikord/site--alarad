import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ActionForm, ConfirmAction, SubmitButton, TextField, Toggle } from '@/components/admin/form';
import { fa } from '@/components/admin/table';
import { fDateTime } from '@/lib/admin/sales/shared';
import { deleteAdminAction, updateAdminAction } from '../actions';

export const metadata: Metadata = { title: 'ویرایش مدیر' };

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const adminId = toId((await params).id);
  if (!adminId) notFound();
  const a = await db.admin.findUnique({
    where: { id: adminId },
    include: { _count: { select: { statusHistories: true, shipments: true, media: true } } },
  });
  if (!a) notFound();
  const isMe = a.id === me.id;
  return (
    <div className="max-w-2xl">
      <Link href="/admins/admins" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به مدیران</Link>
      <AdminPageHeader
        title={a.name}
        description={`آخرین ورود: ${fDateTime(a.lastLoginAt)} · ${fa(a._count.statusHistories)} تغییر وضعیت · ${fa(a._count.shipments)} مرسوله · ${fa(a._count.media)} فایل`}
        action={!isMe ? <ConfirmAction action={deleteAdminAction} fields={{ id: String(a.id) }} confirm="این مدیر حذف شود؟" label="حذف مدیر" size="md" /> : undefined}
      />
      <Panel title="اطلاعات حساب">
        <ActionForm action={updateAdminAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={String(a.id)} />
          <TextField name="name" label="نام" defaultValue={a.name} required />
          <TextField name="phone" label="شمارهٔ موبایل" defaultValue={a.phone} ltr inputMode="tel" required />
          <TextField name="password" type="password" label="رمز عبور جدید" ltr autoComplete="new-password" hint="خالی بگذارید تا تغییر نکند" className="sm:col-span-2" />
          <div className="sm:col-span-2">
            {isMe ? (
              <p className="text-[0.6875rem] text-ink-400">حساب خودتان همیشه فعال می‌ماند.</p>
            ) : (
              <Toggle name="isActive" label="حساب فعال" defaultChecked={a.isActive} />
            )}
            {isMe && <input type="hidden" name="isActive" value="on" />}
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>ذخیرهٔ تغییرات</SubmitButton>
          </div>
        </ActionForm>
      </Panel>
    </div>
  );
}
