import { ActionForm, SubmitButton, TextArea, TextField, Toggle } from '@/components/admin/form';
import type { ActionState } from '@/lib/admin/action';

export interface ShippingValues {
  id?: number;
  code: string;
  title: string;
  description: string;
  cost: number | '';
  freeShippingThreshold: number | '';
  eta: string;
  supportsCod: boolean;
  isActive: boolean;
  sortOrder: number;
  provinces: number[];
}

export function ShippingForm({
  action,
  values,
  provinces,
  submit,
}: {
  action: (p: ActionState, fd: FormData) => Promise<ActionState>;
  values: ShippingValues;
  provinces: { id: number; name: string }[];
  submit: string;
}) {
  const selected = new Set(values.provinces);
  return (
    <ActionForm action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="title" label="عنوان" defaultValue={values.title} required placeholder="پست پیشتاز" />
        <TextField name="code" label="کد سیستمی" defaultValue={values.code} ltr required placeholder="standard" />
        <TextField name="cost" label="هزینهٔ ارسال (تومان)" defaultValue={values.cost} inputMode="numeric" ltr required />
        <TextField name="freeShippingThreshold" label="ارسال رایگان از مبلغ (تومان)" defaultValue={values.freeShippingThreshold} inputMode="numeric" ltr hint="خالی = هیچ‌وقت رایگان نیست" />
        <TextField name="eta" label="زمان تحویل" defaultValue={values.eta} placeholder="۲ تا ۴ روز کاری" />
        <TextField name="sortOrder" label="ترتیب نمایش" defaultValue={values.sortOrder} inputMode="numeric" ltr />
        <TextArea name="description" label="توضیح" defaultValue={values.description} rows={2} className="sm:col-span-2" />
      </div>
      <div className="flex flex-wrap gap-6">
        <Toggle name="isActive" label="فعال" defaultChecked={values.isActive} />
        <Toggle name="supportsCod" label="امکان پرداخت در محل" defaultChecked={values.supportsCod} />
      </div>
      <fieldset>
        <legend className="mb-1 text-[0.75rem] font-medium text-ink-700">استان‌های تحت پوشش</legend>
        <p className="mb-2 text-[0.6875rem] text-ink-400">اگر هیچ استانی انتخاب نشود، این روش برای سراسر کشور فعال است.</p>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-line-soft bg-cream-50 p-3 sm:grid-cols-3 lg:grid-cols-4">
          {provinces.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[0.75rem] text-ink-700 hover:bg-white">
              <input type="checkbox" name="provinces" value={p.id} defaultChecked={selected.has(p.id)} className="size-3.5 accent-[#71816B]" />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton>{submit}</SubmitButton>
    </ActionForm>
  );
}
