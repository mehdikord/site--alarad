import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ActionForm, SubmitButton, TextField } from '@/components/admin/form';
import { fa } from '@/components/admin/table';
import { saveProvinceAction } from './actions';

export const metadata: Metadata = { title: 'استان‌ها و شهرها' };

export default async function LocationsPage() {
  const provinces = await db.province.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { cities: true, orders: true } } },
  });
  const totalCities = provinces.reduce((s, p) => s + p._count.cities, 0);
  return (
    <>
      <AdminPageHeader title="استان‌ها و شهرها" description={`${fa(provinces.length)} استان · ${fa(totalCities)} شهر — در فرم نشانی مشتری و محدودهٔ ارسال استفاده می‌شوند`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {provinces.map((p) => (
            <Link
              key={String(p.id)}
              href={`/admins/locations/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-line-soft bg-white px-4 py-3 transition-colors hover:border-sage-300"
            >
              <span className="text-[0.8125rem] font-medium text-ink-900">{p.name}</span>
              <span className="text-[0.6875rem] text-ink-400">
                {fa(p._count.cities)} شهر{p._count.orders ? ` · ${fa(p._count.orders)} سفارش` : ''}
              </span>
            </Link>
          ))}
        </div>
        <Panel title="افزودن استان">
          <ActionForm action={saveProvinceAction} className="space-y-3" resetOnSuccess>
            <TextField name="name" label="نام استان" required />
            <SubmitButton size="sm">افزودن</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
