import type { Metadata } from 'next';
import { OrderDetail } from '@/components/account/order-detail';

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
  robots: { index: false },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <OrderDetail code={code} />;
}
