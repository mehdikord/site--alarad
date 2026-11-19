import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, FolderTree, Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { categoryTreeOptions } from '@/lib/admin/catalog/categories';
import { AdminPageHeader } from '@/components/admin/ui';
import { Badge, EmptyRow, Table, Td, Th, THead, Tr, fa } from '@/components/admin/table';
import { ConfirmAction } from '@/components/admin/form';
import { adminBtn } from '@/components/admin/styles';
import { deleteCategory, toggleCategory } from './actions';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'دسته‌بندی‌ها' };

export default async function CategoriesPage() {
  await requireAdmin();
  const options = await categoryTreeOptions();
  // product totals incl. descendants
  const total = (id: number): number =>
    (options.find((o) => o.id === id)?.productCount ?? 0) + options.filter((o) => o.parentId === id).reduce((s, c) => s + total(c.id), 0);

  return (
    <>
      <AdminPageHeader
        title="دسته‌بندی‌ها"
        description="دسته‌بندی‌های تودرتو؛ هر دسته می‌تواند زیردسته داشته باشد و محصولات زیردسته‌ها در دستهٔ والد هم نمایش داده می‌شوند."
        action={
          <Link href="/admins/categories/new" className={adminBtn('primary')}>
            <Plus className="size-4" />
            دستهٔ جدید
          </Link>
        }
      />
      <Table>
        <THead>
          <Th>نام دسته</Th>
          <Th>نامک</Th>
          <Th className="text-center">محصولات</Th>
          <Th className="text-center">ترتیب</Th>
          <Th>وضعیت</Th>
          <Th className="text-end">عملیات</Th>
        </THead>
        <tbody>
          {options.length === 0 && <EmptyRow colSpan={6}>هنوز دسته‌ای ساخته نشده است.</EmptyRow>}
          {options.map((c) => (
            <Tr key={c.id} className={cn(c.depth === 0 && 'bg-cream-50/60')}>
              <Td>
                <div className="flex items-center gap-2" style={{ paddingInlineStart: `${c.depth * 22}px` }}>
                  {c.depth > 0 && <span className="text-ink-200">└</span>}
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="size-8 rounded-md object-cover" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-md bg-cream-200 text-ink-300">
                      <FolderTree className="size-3.5" />
                    </span>
                  )}
                  <div>
                    <Link href={`/admins/categories/${c.id}`} className={cn('text-ink-900 hover:text-sage-700', c.depth === 0 && 'font-medium')}>
                      {c.name}
                    </Link>
                    {c.childCount > 0 && <p className="text-[0.625rem] text-ink-400">{fa(c.childCount)} زیردسته</p>}
                  </div>
                </div>
              </Td>
              <Td>
                <span className="font-mono text-[0.6875rem] text-ink-400" dir="ltr">{c.slug}</span>
              </Td>
              <Td className="text-center">
                {fa(total(c.id))}
                {c.childCount > 0 && c.productCount !== total(c.id) && <span className="block text-[0.625rem] text-ink-300">({fa(c.productCount)} مستقیم)</span>}
              </Td>
              <Td className="text-center">{fa(c.sortOrder)}</Td>
              <Td>
                <ConfirmAction action={toggleCategory} fields={{ id: c.id }} confirm={c.isActive ? `«${c.name}» غیرفعال شود؟` : `«${c.name}» فعال شود؟`} variant="ghost" className="h-auto px-0">
                  <Badge tone={c.isActive ? 'bg-sage-100 text-sage-700' : 'bg-cream-300 text-ink-500'}>{c.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                </ConfirmAction>
              </Td>
              <Td className="text-end">
                <div className="flex justify-end gap-1">
                  <Link href={`/admins/categories/new?parent=${c.id}`} className={adminBtn('ghost', 'sm')} title="افزودن زیردسته">
                    <Plus className="size-3.5" />
                    زیردسته
                  </Link>
                  <Link href={`/admins/categories/${c.id}`} className={adminBtn('outline', 'sm')}>
                    <Pencil className="size-3.5" />
                    ویرایش
                  </Link>
                  <ConfirmAction action={deleteCategory} fields={{ id: c.id }} label="حذف" confirm={`دستهٔ «${c.name}» حذف شود؟`} />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
