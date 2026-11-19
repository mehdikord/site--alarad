'use client';

import { ActionForm, SubmitButton, TextField } from '@/components/admin/form';
import { loginAction } from './actions';

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={loginAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <TextField name="phone" label="شمارهٔ موبایل" placeholder="09120000000" inputMode="tel" autoComplete="username" ltr required />
      <TextField name="password" type="password" label="رمز عبور" autoComplete="current-password" ltr required />
      <SubmitButton className="w-full">ورود</SubmitButton>
    </ActionForm>
  );
}
