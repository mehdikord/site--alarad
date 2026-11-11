import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata: Metadata = {
  title: { default: 'پنل مدیریت', template: '%s | پنل الاردشاپ' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
