import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { toId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { editorOptions, productForEditor } from '@/lib/admin/catalog/products';
import { AdminPageHeader } from '@/components/admin/ui';
import { ProductEditor } from '@/components/admin/catalog/product-editor';
import { ConfirmAction } from '@/components/admin/form';
import { adminBtn } from '@/components/admin/styles';
import { fa } from '@/components/admin/table';
import { deleteProduct, saveProduct } from '../actions';

export const metadata: Metadata = { title: 'ویرایش محصول' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = toId((await params).id);
  if (!id) notFound();
  const [data, options] = await Promise.all([productForEditor(id), editorOptions()]);
  if (!data) notFound();
  const { payload, stats } = data;
  return (
    <>
      <AdminPageHeader
        title={payload.name}
        description={`فروش ${fa(stats.salesCount)} عدد · امتیاز ${fa(stats.rating)} از ${fa(stats.reviewCount)} نظر`}
        action={
          <div className="flex gap-2">
            {payload.status === 'active' && (
              <Link href={`/product/${payload.slug}`} target="_blank" className={adminBtn('outline', 'sm')}>
                <ExternalLink className="size-3.5" />
                مشاهده در فروشگاه
              </Link>
            )}
            <Link href="/admins/products" className={adminBtn('ghost', 'sm')}>
              بازگشت به فهرست
            </Link>
          </div>
        }
      />
      <ProductEditor key={payload.id ?? 'new'} initial={payload} options={options} orderedVariantIds={data.orderedVariantIds} save={saveProduct} />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blush-300/60 bg-white p-4">
        <div>
          <p className="text-[0.8125rem] font-medium text-ink-900">حذف محصول</p>
          <p className="text-[0.6875rem] text-ink-400">
            {data.orderCount > 0
              ? `این محصول در ${fa(data.orderCount)} ردیف سفارش ثبت شده و فقط قابل بایگانی است.`
              : 'محصول، تنوع‌ها، تصاویر گالری و نظرهای آن حذف می‌شوند (فایل‌ها در رسانه می‌مانند).'}
          </p>
        </div>
        <ConfirmAction action={deleteProduct} fields={{ id: Number(id) }} label="حذف محصول" confirm={`«${payload.name}» برای همیشه حذف شود؟`} />
      </div>
    </>
  );
}
