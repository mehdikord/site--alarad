import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, toId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { categoryTreeOptions, descendantsOf } from '@/lib/admin/catalog/categories';
import { AdminPageHeader } from '@/components/admin/ui';
import { CategoryForm } from '@/components/admin/catalog/category-form';
import { deleteCategory, saveCategory } from '../actions';

export const metadata: Metadata = { title: 'ویرایش دسته' };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = toId((await params).id);
  if (!id) notFound();
  const cat = await db.category.findUnique({ where: { id }, include: { image: true } });
  if (!cat) notFound();
  const options = await categoryTreeOptions();
  const blocked = new Set(descendantsOf(options, Number(cat.id)));
  return (
    <>
      <AdminPageHeader title={`ویرایش «${cat.name}»`} />
      <CategoryForm
        save={saveCategory}
        remove={deleteCategory}
        parents={options.filter((o) => !blocked.has(o.id))}
        value={{
          id: Number(cat.id),
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId === null ? null : Number(cat.parentId),
          tagline: cat.tagline ?? '',
          description: cat.description ?? '',
          accent: cat.accent ?? '',
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          metaTitle: cat.metaTitle ?? '',
          metaDescription: cat.metaDescription ?? '',
          image: cat.image ? { id: Number(cat.image.id), url: cat.image.url, alt: cat.image.alt ?? '' } : null,
        }}
      />
    </>
  );
}
