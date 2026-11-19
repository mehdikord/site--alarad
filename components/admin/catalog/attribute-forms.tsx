'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { ActionForm, SubmitButton, ConfirmAction, adminInput, useFieldError } from '@/components/admin/form';
import { cn } from '@/lib/utils';
import type { ActionState } from '@/lib/admin/action';

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

function Cell({ name, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  const error = useFieldError(name);
  return (
    <div className={className}>
      <input name={name} {...props} className={cn(adminInput, 'h-9', error && 'border-blush-300')} title={error} />
      {error && <p className="mt-0.5 text-[0.625rem] text-blush-500">{error}</p>}
    </div>
  );
}

/* ── colour row (also used for "new") ── */
export function ColorRow({
  value,
  save,
  remove,
}: {
  value?: { id: number; key: string; name: string; hex: string; swatch: string; sortOrder: number; usage: number };
  save: Action;
  remove: Action;
}) {
  const [hex, setHex] = React.useState(value?.hex ?? '#E3D5C3');
  const [swatch, setSwatch] = React.useState(value?.swatch ?? '');
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
  return (
    <div className="flex flex-wrap items-start gap-2 border-b border-line-soft px-3 py-2.5 last:border-0">
      <ActionForm action={save} resetOnSuccess={!value} className="flex flex-1 flex-wrap items-start gap-2">
        {value && <input type="hidden" name="id" value={value.id} />}
        <span
          className="mt-0.5 size-8 shrink-0 rounded-full border border-white shadow-[0_1px_3px_rgba(58,50,44,.25)]"
          style={{ background: swatch || hex }}
          aria-hidden
        />
        <Cell name="name" defaultValue={value?.name} placeholder="نام رنگ (کرم)" className="w-32" />
        <Cell name="key" defaultValue={value?.key} placeholder="key (cream)" dir="ltr" className="w-28" />
        <div className="flex items-center gap-1">
          <input type="color" value={valid ? hex : '#000000'} onChange={(e) => setHex(e.target.value.toUpperCase())} className="h-9 w-9 cursor-pointer rounded-lg border border-line bg-white p-1" aria-label="انتخاب رنگ" />
          <Cell name="hex" value={hex} onChange={(e) => setHex(e.target.value)} dir="ltr" className="w-24" />
        </div>
        <Cell name="swatch" value={swatch} onChange={(e) => setSwatch(e.target.value)} placeholder="linear-gradient(…) اختیاری" dir="ltr" className="min-w-40 flex-1" />
        <Cell name="sortOrder" type="number" min={0} defaultValue={value?.sortOrder ?? 0} dir="ltr" className="w-16" />
        <SubmitButton size="sm" className="mt-0.5" variant={value ? 'outline' : 'primary'}>
          {value ? 'ذخیره' : 'افزودن'}
        </SubmitButton>
      </ActionForm>
      {value && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[0.625rem] text-ink-400">{value.usage ? `${new Intl.NumberFormat('fa-IR').format(value.usage)} تنوع` : 'بدون استفاده'}</span>
          <ConfirmAction action={remove} fields={{ id: value.id }} confirm={`رنگ «${value.name}» حذف شود؟`}>
            <Trash2 className="size-3.5" />
          </ConfirmAction>
        </div>
      )}
    </div>
  );
}

/* ── size row ── */
export function SizeRow({
  value,
  defaultGroup,
  save,
  remove,
}: {
  value?: { id: number; sizeGroup: string; key: string; label: string; note: string; sortOrder: number; usage: number };
  defaultGroup?: string;
  save: Action;
  remove: Action;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2 border-b border-line-soft px-3 py-2.5 last:border-0">
      <ActionForm action={save} resetOnSuccess={!value} className="flex flex-1 flex-wrap items-start gap-2">
        {value && <input type="hidden" name="id" value={value.id} />}
        <Cell name="sizeGroup" defaultValue={value?.sizeGroup ?? defaultGroup} placeholder="گروه (tights)" dir="ltr" className="w-28" />
        <Cell name="key" defaultValue={value?.key} placeholder="key (m)" dir="ltr" className="w-24" />
        <Cell name="label" defaultValue={value?.label} placeholder="برچسب (M)" className="w-28" />
        <Cell name="note" defaultValue={value?.note} placeholder="راهنما (قد ۱۶۰ تا ۱۷۰)" className="min-w-40 flex-1" />
        <Cell name="sortOrder" type="number" min={0} defaultValue={value?.sortOrder ?? 0} dir="ltr" className="w-16" />
        <SubmitButton size="sm" className="mt-0.5" variant={value ? 'outline' : 'primary'}>
          {value ? 'ذخیره' : 'افزودن'}
        </SubmitButton>
      </ActionForm>
      {value && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[0.625rem] text-ink-400">{value.usage ? `${new Intl.NumberFormat('fa-IR').format(value.usage)} تنوع` : 'بدون استفاده'}</span>
          <ConfirmAction action={remove} fields={{ id: value.id }} confirm={`سایز «${value.label}» حذف شود؟`}>
            <Trash2 className="size-3.5" />
          </ConfirmAction>
        </div>
      )}
    </div>
  );
}

/* ── tag row ── */
export function TagRow({
  value,
  save,
  remove,
}: {
  value?: { id: number; name: string; slug: string; usage: number };
  save: Action;
  remove: Action;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2 border-b border-line-soft px-3 py-2.5 last:border-0">
      <ActionForm action={save} resetOnSuccess={!value} className="flex flex-1 flex-wrap items-start gap-2">
        {value && <input type="hidden" name="id" value={value.id} />}
        <Cell name="name" defaultValue={value?.name} placeholder="نام برچسب (هدیه)" className="w-40" />
        <Cell name="slug" defaultValue={value?.slug} placeholder="slug (gift)" dir="ltr" className="w-40" />
        <SubmitButton size="sm" className="mt-0.5" variant={value ? 'outline' : 'primary'}>
          {value ? 'ذخیره' : 'افزودن'}
        </SubmitButton>
      </ActionForm>
      {value && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[0.625rem] text-ink-400">{new Intl.NumberFormat('fa-IR').format(value.usage)} محصول</span>
          <ConfirmAction action={remove} fields={{ id: value.id }} confirm={`برچسب «${value.name}» حذف و از محصولات برداشته شود؟`}>
            <Trash2 className="size-3.5" />
          </ConfirmAction>
        </div>
      )}
    </div>
  );
}
