import type { Metadata } from 'next';
import { AdminInventory } from '@/components/admin/admin-inventory';

export const metadata: Metadata = { title: 'موجودی انبار' };

export default function AdminInventoryPage() {
  return <AdminInventory />;
}
