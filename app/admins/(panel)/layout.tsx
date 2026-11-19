import type { Metadata } from 'next';
import { requireAdmin, endAdminSession } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata: Metadata = {
  title: { default: 'پنل مدیریت', template: '%s | پنل الاردشاپ' },
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

async function logout() {
  'use server';
  await endAdminSession();
  redirect('/admins/login');
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const settings = await getSettings();
  const [orders, lowStock, reviews] = await Promise.all([
    db.order.count({ where: { status: 'processing' } }),
    db.productVariant.count({ where: { isActive: true, stock: { lte: settings.lowStockThreshold }, product: { status: 'active' } } }),
    db.review.count({ where: { status: 'pending' } }),
  ]);
  return (
    <AdminShell admin={{ name: admin.name, phone: admin.phone }} badges={{ orders, lowStock, reviews }} logout={logout}>
      {children}
    </AdminShell>
  );
}
