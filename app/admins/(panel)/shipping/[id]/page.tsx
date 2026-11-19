import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ConfirmAction } from '@/components/admin/form';
import { ShippingForm } from '@/components/admin/sales/shipping-form';
import { deleteShippingAction, updateShippingAction } from '../actions';

export const metadata: Metadata = { title: 'ویرایش روش ارسال' };

export default async function EditShippingPage({ params }: { params: Promise<{ id: string }> }) {
  const methodId = toId((await params).id);
  if (!methodId) notFound();
  const [m, provinces] = await Promise.all([
    db.shippingMethod.findUnique({ where: { id: methodId }, include: { provinces: true } }),
    db.province.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!m) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/admins/shipping" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به روش‌های ارسال</Link>
      <AdminPageHeader
        title={m.title}
        action={<ConfirmAction action={deleteShippingAction} fields={{ id: String(m.id) }} confirm="این روش ارسال حذف شود؟" label="حذف" size="md" />}
      />
      <Panel title="مشخصات">
        <ShippingForm
          action={updateShippingAction}
          submit="ذخیرهٔ تغییرات"
          provinces={provinces.map((p) => ({ id: Number(p.id), name: p.name }))}
          values={{
            id: Number(m.id),
            code: m.code,
            title: m.title,
            description: m.description ?? '',
            cost: m.cost,
            freeShippingThreshold: m.freeShippingThreshold ?? '',
            eta: m.eta ?? '',
            supportsCod: m.supportsCod,
            isActive: m.isActive,
            sortOrder: m.sortOrder,
            provinces: m.provinces.map((p) => Number(p.provinceId)),
          }}
        />
      </Panel>
    </div>
  );
}
