import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { editorOptions } from '@/lib/admin/catalog/products';
import { AdminPageHeader } from '@/components/admin/ui';
import { ProductEditor } from '@/components/admin/catalog/product-editor';
import { emptyProduct } from '@/lib/admin/catalog/empty-product';
import { saveProduct } from '../actions';

export const metadata: Metadata = { title: 'محصول جدید' };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireAdmin();
  const options = await editorOptions();
  const { category } = await searchParams;
  const initial = emptyProduct();
  if (options.categories.some((c) => c.id === Number(category))) initial.categoryId = Number(category);
  return (
    <>
      <AdminPageHeader title="محصول جدید" description="اطلاعات، تصاویر و تنوع‌های محصول را وارد کنید؛ تا زمان انتشار در فروشگاه دیده نمی‌شود." />
      <ProductEditor initial={initial} options={options} save={saveProduct} />
    </>
  );
}
