import type { Metadata } from 'next';
import { AdminOrders } from '@/components/admin/admin-orders';

export const metadata: Metadata = { title: 'سفارش‌ها' };

export default function AdminOrdersPage() {
  return <AdminOrders />;
}
