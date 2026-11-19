import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ActionForm, ConfirmAction, SubmitButton, TextField } from '@/components/admin/form';
import { adminInput } from '@/components/admin/styles';
import { fa } from '@/components/admin/table';
import { deleteCityAction, deleteProvinceAction, saveCityAction, saveProvinceAction } from '../actions';

export const metadata: Metadata = { title: 'شهرهای استان' };

export default async function ProvinceCitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const pid = toId((await params).id);
  if (!pid) notFound();
  const province = await db.province.findUnique({
    where: { id: pid },
    include: { cities: { orderBy: { name: 'asc' }, include: { _count: { select: { addresses: true, orders: true } } } } },
  });
  if (!province) notFound();

  return (
    <>
      <Link href="/admins/locations" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← همهٔ استان‌ها</Link>
      <AdminPageHeader
        title={`استان ${province.name}`}
        description={`${fa(province.cities.length)} شهر · شناسهٔ استان ${fa(Number(province.id))}`}
        action={<ConfirmAction action={deleteProvinceAction} fields={{ id: String(province.id) }} confirm="استان و همهٔ شهرهایش حذف شوند؟" label="حذف استان" size="md" />}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="شهرها">
          {province.cities.length === 0 ? (
            <p className="py-6 text-center text-[0.75rem] text-ink-400">شهری ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {province.cities.map((c) => {
                const used = c._count.addresses + c._count.orders;
                return (
                  <li key={String(c.id)} className="flex flex-wrap items-center gap-2 py-2">
                    <ActionForm action={saveCityAction} className="flex min-w-0 flex-1 items-center gap-2">
                      <input type="hidden" name="id" value={String(c.id)} />
                      <input type="hidden" name="provinceId" value={String(province.id)} />
                      <input name="name" defaultValue={c.name} className={`${adminInput} h-8 min-w-0 flex-1 text-[0.8125rem]`} aria-label="نام شهر" />
                      <SubmitButton size="sm" variant="outline">ذخیره</SubmitButton>
                    </ActionForm>
                    <span className="w-24 text-[0.625rem] text-ink-400">{used ? `${fa(used)} استفاده` : 'بدون استفاده'}</span>
                    {used === 0 && <ConfirmAction action={deleteCityAction} fields={{ id: String(c.id) }} confirm={`شهر «${c.name}» حذف شود؟`} label="حذف" />}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="افزودن شهر">
            <ActionForm action={saveCityAction} className="space-y-3" resetOnSuccess>
              <input type="hidden" name="provinceId" value={String(province.id)} />
              <TextField name="name" label="نام شهر" required />
              <SubmitButton size="sm">افزودن شهر</SubmitButton>
            </ActionForm>
          </Panel>
          <Panel title="ویرایش نام استان">
            <ActionForm action={saveProvinceAction} className="space-y-3">
              <input type="hidden" name="id" value={String(province.id)} />
              <TextField name="name" label="نام" defaultValue={province.name} required />
              <SubmitButton size="sm" variant="outline">ذخیره</SubmitButton>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
