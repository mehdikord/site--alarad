'use client';

import Link from 'next/link';
import { ActionForm, ConfirmAction, SubmitButton, TextArea, TextField, SelectField, Toggle, adminBtn } from '@/components/admin/form';
import { Panel } from '@/components/admin/ui';
import { MediaField, type MediaPreview } from '@/components/admin/catalog/media-picker';
import type { ActionState } from '@/lib/admin/action';

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export interface CategoryFormValue {
  id?: number;
  name: string;
  slug: string;
  parentId: number | null;
  tagline: string;
  description: string;
  accent: string;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  image: MediaPreview | null;
}

export function CategoryForm({
  value,
  parents,
  save,
  remove,
}: {
  value: CategoryFormValue;
  /** already filtered: excludes self + descendants */
  parents: { id: number; name: string; depth: number }[];
  save: Action;
  remove?: Action;
}) {
  return (
    <div className="space-y-4">
      <ActionForm action={save} className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {value.id && <input type="hidden" name="id" value={value.id} />}
        <div className="space-y-4">
          <Panel title="اطلاعات دسته">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name="name" label="نام دسته" defaultValue={value.name} required />
              <TextField name="slug" label="نامک (slug)" defaultValue={value.slug} ltr hint="خالی بگذارید تا از روی نام ساخته شود. در نشانی /shop/… استفاده می‌شود." />
              <SelectField
                name="parentId"
                label="دستهٔ والد"
                defaultValue={value.parentId ?? ''}
                placeholder="— دستهٔ اصلی (بدون والد) —"
                options={parents.map((p) => ({ value: p.id, label: `${'— '.repeat(p.depth)}${p.name}` }))}
              />
              <TextField name="tagline" label="شعار کوتاه" defaultValue={value.tagline} />
              <TextArea name="description" label="توضیحات" defaultValue={value.description} rows={4} className="sm:col-span-2" />
            </div>
          </Panel>
          <Panel title="سئو" description="عنوان و توضیح صفحهٔ دسته در موتورهای جست‌وجو">
            <div className="grid gap-3">
              <TextField name="metaTitle" label="عنوان متا" defaultValue={value.metaTitle} />
              <TextArea name="metaDescription" label="توضیح متا" defaultValue={value.metaDescription} rows={2} maxLength={500} />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="انتشار">
            <div className="space-y-3">
              <Toggle name="isActive" label="فعال در فروشگاه" defaultChecked={value.isActive} hint="دستهٔ غیرفعال و زیردسته‌هایش در فروشگاه نمایش داده نمی‌شوند." />
              <TextField name="sortOrder" type="number" min={0} label="ترتیب نمایش" defaultValue={value.sortOrder} ltr />
              <TextField name="accent" label="رنگ تأکیدی" defaultValue={value.accent} ltr hint="مثلاً sage، blush یا cream" />
              <div className="flex gap-2 pt-1">
                <SubmitButton className="flex-1">{value.id ? 'ذخیرهٔ تغییرات' : 'ساخت دسته'}</SubmitButton>
                <Link href="/admins/categories" className={adminBtn('outline')}>
                  انصراف
                </Link>
              </div>
            </div>
          </Panel>
          <Panel title="تصویر دسته">
            <MediaField name="imageId" defaultValue={value.image} hint="در صفحهٔ دسته و منوی فروشگاه نمایش داده می‌شود." />
          </Panel>
        </div>
      </ActionForm>

      {value.id && remove && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blush-300/60 bg-white p-4">
          <div>
            <p className="text-[0.8125rem] font-medium text-ink-900">حذف دسته</p>
            <p className="text-[0.6875rem] text-ink-400">فقط دسته‌هایی که زیردسته یا محصول ندارند قابل حذف‌اند.</p>
          </div>
          <ConfirmAction action={remove} fields={{ id: value.id }} label="حذف دسته" confirm={`دستهٔ «${value.name}» حذف شود؟`} />
        </div>
      )}
    </div>
  );
}
