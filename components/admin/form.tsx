'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/lib/store';
import type { ActionState } from '@/lib/admin/action';
import { adminBtn, adminInput } from '@/components/admin/styles';

export { adminBtn, adminInput };

/* ───────────────────────── action form ───────────────────────── */

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const FormErrors = React.createContext<Record<string, string> | undefined>(undefined);
export const useFieldError = (name?: string) => {
  const errors = React.useContext(FormErrors);
  return name ? errors?.[name] : undefined;
};

/**
 * <form> bound to a server action: shows a toast with the result, refreshes the
 * route on success and follows `redirect` when provided.
 */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess,
  confirm,
  id,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  onSuccess?: (state: NonNullable<ActionState>) => void;
  resetOnSuccess?: boolean;
  confirm?: string;
  id?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const notify = useUi((s) => s.notify);
  const router = useRouter();
  const ref = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!state) return;
    notify(state.message, state.ok ? 'success' : 'error');
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
      if (state.redirect) router.push(state.redirect);
      else router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <FormErrors.Provider value={state?.ok ? undefined : state?.errors}>
      <form
        ref={ref}
        id={id}
        action={formAction}
        className={className}
        onSubmit={(e) => {
          if (confirm && !window.confirm(confirm)) e.preventDefault();
        }}
      >
        {children}
      </form>
    </FormErrors.Provider>
  );
}

/* ───────────────────────── buttons ───────────────────────── */

export function SubmitButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  name,
  value,
  formAction,
}: {
  children: React.ReactNode;
  variant?: Parameters<typeof adminBtn>[0];
  size?: Parameters<typeof adminBtn>[1];
  className?: string;
  name?: string;
  value?: string;
  formAction?: (fd: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} formAction={formAction} disabled={pending} className={cn(adminBtn(variant, size), className)}>
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/* ───────────────────────── fields ───────────────────────── */

const inputCls = adminInput;

export function FieldShell({
  label,
  hint,
  error,
  children,
  className,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[0.75rem] font-medium text-ink-700">
          {label}
          {required && <span className="ms-0.5 text-blush-500">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-[0.6875rem] text-blush-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[0.6875rem] text-ink-300">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextField({
  label,
  hint,
  className,
  ltr,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; ltr?: boolean }) {
  const error = useFieldError(props.name);
  return (
    <FieldShell label={label} hint={hint} error={error} className={className} required={props.required}>
      <input {...props} dir={ltr ? 'ltr' : props.dir} className={cn(inputCls, ltr && 'text-left', error && 'border-blush-300')} />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  const error = useFieldError(props.name);
  return (
    <FieldShell label={label} hint={hint} error={error} className={className} required={props.required}>
      <textarea {...props} className={cn(inputCls, 'h-auto min-h-24 py-2.5 leading-7', error && 'border-blush-300')} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  className,
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string | number; label: string; disabled?: boolean }[];
}) {
  const error = useFieldError(props.name);
  return (
    <FieldShell label={label} hint={hint} error={error} className={className} required={props.required}>
      <select {...props} className={cn(inputCls, 'pe-8', error && 'border-blush-300')}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** checkbox styled as a switch; submits "on" when checked */
export function Toggle({
  name,
  label,
  defaultChecked,
  checked,
  onChange,
  hint,
}: {
  name?: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <span className="relative mt-0.5 inline-flex">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-5 w-9 rounded-full bg-cream-300 transition-colors peer-checked:bg-sage-500 peer-focus-visible:ring-2 peer-focus-visible:ring-sage-400" />
        <span className="absolute start-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-4" />
      </span>
      <span>
        <span className="block text-[0.8125rem] text-ink-800">{label}</span>
        {hint && <span className="block text-[0.6875rem] text-ink-400">{hint}</span>}
      </span>
    </label>
  );
}

/** inline "are you sure?" delete/confirm button that submits a server action */
export function ConfirmAction({
  action,
  fields,
  label,
  confirm = 'آیا مطمئن هستید؟',
  variant = 'danger',
  size = 'sm',
  className,
  children,
}: {
  action: Action;
  fields: Record<string, string | number>;
  label?: string;
  confirm?: string;
  variant?: Parameters<typeof adminBtn>[0];
  size?: Parameters<typeof adminBtn>[1];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <ActionForm action={action} confirm={confirm} className="inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} size={size} className={className}>
        {children ?? label}
      </SubmitButton>
    </ActionForm>
  );
}
