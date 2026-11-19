import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { ActionForm, SubmitButton, TextArea, TextField, Toggle } from '@/components/admin/form';
import { Badge } from '@/components/admin/table';
import { GATEWAY_LABEL } from '@/lib/order-meta';
import { saveSettingsAction } from './actions';

export const metadata: Metadata = { title: 'تنظیمات فروشگاه' };

const GROUPS: Record<string, { title: string; description: string }> = {
  general: { title: 'اطلاعات فروشگاه', description: 'نام، راه‌های تماس و ساعات پاسخ‌گویی' },
  checkout: { title: 'خرید و پرداخت', description: 'مالیات، ارسال رایگان، کد سفارش و مهلت پرداخت' },
  inventory: { title: 'انبار', description: 'هشدارهای موجودی' },
  catalog: { title: 'کاتالوگ', description: 'رفتار نظرها و محصولات' },
};

export default async function SettingsPage() {
  const rows = await db.setting.findMany({ orderBy: { id: 'asc' } });
  const groups = [...new Set(rows.map((r) => r.group))].sort(
    (a, b) => Object.keys(GROUPS).indexOf(a) - Object.keys(GROUPS).indexOf(b),
  );
  const driver = process.env.PAYMENT_DRIVER ?? 'mock';
  const sms = process.env.SMS_DRIVER ?? 'log';

  return (
    <>
      <AdminPageHeader title="تنظیمات فروشگاه" />
      <ActionForm action={saveSettingsAction} className="space-y-4">
        {groups.map((g) => (
          <Panel key={g} title={GROUPS[g]?.title ?? g} description={GROUPS[g]?.description}>
            <div className="grid gap-4 sm:grid-cols-2">
              {rows
                .filter((r) => r.group === g)
                .map((r) => {
                  const name = `s_${r.key}`;
                  const label = r.label ?? r.key;
                  if (r.type === 'boolean')
                    return (
                      <div key={r.key} className="flex items-center sm:col-span-2">
                        <Toggle name={name} label={label} defaultChecked={r.value === 'true' || r.value === '1'} />
                      </div>
                    );
                  if (r.type === 'text')
                    return <TextArea key={r.key} name={name} label={label} defaultValue={r.value ?? ''} rows={2} className="sm:col-span-2" />;
                  return (
                    <TextField
                      key={r.key}
                      name={name}
                      label={label}
                      defaultValue={r.value ?? ''}
                      inputMode={r.type === 'number' ? 'numeric' : undefined}
                      ltr={r.type === 'number' || r.key.includes('phone') || r.key.includes('email') || r.key === 'order_code_prefix'}
                    />
                  );
                })}
            </div>
          </Panel>
        ))}
        <div className="sticky bottom-0 z-10 -mx-1 flex justify-end border-t border-line-soft bg-cream-100/95 px-1 py-3 backdrop-blur">
          <SubmitButton>ذخیرهٔ تنظیمات</SubmitButton>
        </div>
      </ActionForm>

      <div className="mt-4">
        <Panel title="سرویس‌های متصل" description="از فایل ‎.env خوانده می‌شود و فقط از طریق سرور قابل تغییر است">
          <dl className="grid gap-3 text-[0.8125rem] sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-line-soft px-3 py-2.5">
              <dt className="text-ink-500">درگاه پرداخت (PAYMENT_DRIVER)</dt>
              <dd className="flex items-center gap-1.5">
                <Badge tone={driver === 'mock' ? 'bg-blush-100 text-blush-500' : 'bg-sage-100 text-sage-700'}>{GATEWAY_LABEL[driver] ?? driver}</Badge>
                {driver === 'zarinpal' && (process.env.ZARINPAL_SANDBOX ?? 'true') === 'true' && <Badge>sandbox</Badge>}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line-soft px-3 py-2.5">
              <dt className="text-ink-500">ارسال پیامک (SMS_DRIVER)</dt>
              <dd><Badge tone={sms === 'log' ? 'bg-blush-100 text-blush-500' : 'bg-sage-100 text-sage-700'}>{sms === 'log' ? 'آزمایشی (لاگ)' : sms}</Badge></dd>
            </div>
          </dl>
          {driver === 'mock' && (
            <p className="mt-3 text-[0.6875rem] text-ink-400">درگاه آزمایشی فعال است؛ برای پرداخت واقعی PAYMENT_DRIVER=zarinpal و ZARINPAL_MERCHANT_ID را تنظیم کنید.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
