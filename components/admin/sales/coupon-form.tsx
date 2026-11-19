import { ActionForm, SelectField, SubmitButton, TextField, Toggle } from '@/components/admin/form';
import type { ActionState } from '@/lib/admin/action';

export interface CouponValues {
  id?: number;
  code: string;
  title: string;
  type: 'percent' | 'fixed';
  value: number | '';
  maxDiscount: number | '';
  minOrderAmount: number | '';
  usageLimit: number | '';
  perUserLimit: number | '';
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export function CouponForm({
  action,
  values,
  submit,
}: {
  action: (p: ActionState, fd: FormData) => Promise<ActionState>;
  values: CouponValues;
  submit: string;
}) {
  return (
    <ActionForm action={action} className="grid gap-3 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="code" label="کد" defaultValue={values.code} ltr required placeholder="SUMMER20" hint="مشتری همین کد را وارد می‌کند" />
      <TextField name="title" label="عنوان" defaultValue={values.title} required placeholder="۲۰٪ تخفیف تابستانه" />
      <SelectField
        name="type"
        label="نوع تخفیف"
        defaultValue={values.type}
        options={[
          { value: 'percent', label: 'درصدی' },
          { value: 'fixed', label: 'مبلغ ثابت (تومان)' },
        ]}
      />
      <TextField name="value" label="مقدار" defaultValue={values.value} inputMode="numeric" ltr required hint="درصد (۱ تا ۱۰۰) یا مبلغ به تومان" />
      <TextField name="maxDiscount" label="سقف تخفیف (تومان)" defaultValue={values.maxDiscount} inputMode="numeric" ltr hint="برای تخفیف درصدی؛ خالی = بدون سقف" />
      <TextField name="minOrderAmount" label="حداقل مبلغ سفارش (تومان)" defaultValue={values.minOrderAmount} inputMode="numeric" ltr />
      <TextField name="usageLimit" label="سقف کل استفاده" defaultValue={values.usageLimit} inputMode="numeric" ltr hint="خالی = نامحدود" />
      <TextField name="perUserLimit" label="سقف استفادهٔ هر کاربر" defaultValue={values.perUserLimit} inputMode="numeric" ltr hint="خالی = نامحدود" />
      <TextField name="startsAt" type="datetime-local" label="شروع اعتبار" defaultValue={values.startsAt} ltr />
      <TextField name="expiresAt" type="datetime-local" label="پایان اعتبار" defaultValue={values.expiresAt} ltr />
      <div className="sm:col-span-2">
        <Toggle name="isActive" label="فعال" defaultChecked={values.isActive} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{submit}</SubmitButton>
      </div>
    </ActionForm>
  );
}
