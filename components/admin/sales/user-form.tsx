import { ActionForm, SubmitButton, TextField, Toggle } from '@/components/admin/form';
import type { ActionState } from '@/lib/admin/action';

export function UserForm({
  action,
  user,
  submit,
}: {
  action: (p: ActionState, fd: FormData) => Promise<ActionState>;
  user?: { id: number; name: string; phone: string; email: string; isActive: boolean };
  submit: string;
}) {
  return (
    <ActionForm action={action} className="grid gap-3 sm:grid-cols-2">
      {user && <input type="hidden" name="id" value={user.id} />}
      <TextField name="name" label="نام و نام خانوادگی" defaultValue={user?.name} />
      <TextField name="phone" label="شمارهٔ موبایل" defaultValue={user?.phone} ltr inputMode="tel" placeholder="09xxxxxxxxx" required />
      <TextField name="email" type="email" label="ایمیل" defaultValue={user?.email} ltr />
      <div className="flex items-end pb-2">
        <Toggle name="isActive" label="حساب فعال" defaultChecked={user?.isActive ?? true} hint="کاربر غیرفعال نمی‌تواند وارد شود" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{submit}</SubmitButton>
      </div>
    </ActionForm>
  );
}
