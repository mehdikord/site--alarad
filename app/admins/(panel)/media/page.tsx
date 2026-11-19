import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminPageHeader } from '@/components/admin/ui';
import { MediaLibrary } from '@/components/admin/catalog/media-library';

export const metadata: Metadata = { title: 'رسانه' };

export default async function MediaPage() {
  await requireAdmin();
  return (
    <>
      <AdminPageHeader
        title="کتابخانهٔ رسانه"
        description="همهٔ تصاویر محصولات، دسته‌بندی‌ها و … اینجا نگه‌داری می‌شوند و در همهٔ بخش‌ها قابل انتخاب‌اند."
      />
      <MediaLibrary />
    </>
  );
}
