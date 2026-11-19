import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ShippingForm } from '@/components/admin/sales/shipping-form';
import { createShippingAction } from '../actions';

export const metadata: Metadata = { title: 'روش ارسال جدید' };

export default async function NewShippingPage() {
  const provinces = await db.province.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="max-w-4xl">
      <Link href="/admins/shipping" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به روش‌های ارسال</Link>
      <AdminPageHeader title="روش ارسال جدید" />
      <Panel title="مشخصات">
        <ShippingForm
          action={createShippingAction}
          submit="ساخت روش ارسال"
          provinces={provinces.map((p) => ({ id: Number(p.id), name: p.name }))}
          values={{ code: '', title: '', description: '', cost: '', freeShippingThreshold: '', eta: '', supportsCod: false, isActive: true, sortOrder: 0, provinces: [] }}
        />
      </Panel>
    </div>
  );
}
