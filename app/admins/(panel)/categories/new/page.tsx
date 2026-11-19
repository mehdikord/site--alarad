import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { categoryTreeOptions } from '@/lib/admin/catalog/categories';
import { AdminPageHeader } from '@/components/admin/ui';
import { CategoryForm } from '@/components/admin/catalog/category-form';
import { saveCategory } from '../actions';

export const metadata: Metadata = { title: 'دستهٔ جدید' };

export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<{ parent?: string }> }) {
  await requireAdmin();
  const { parent } = await searchParams;
  const options = await categoryTreeOptions();
  const parentId = options.some((o) => o.id === Number(parent)) ? Number(parent) : null;
  return (
    <>
      <AdminPageHeader title="دستهٔ جدید" description="برای ساخت زیردسته، دستهٔ والد را انتخاب کنید." />
      <CategoryForm
        save={saveCategory}
        parents={options}
        value={{ name: '', slug: '', parentId, tagline: '', description: '', accent: '', sortOrder: 0, isActive: true, metaTitle: '', metaDescription: '', image: null }}
      />
    </>
  );
}
