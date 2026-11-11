import type { Metadata } from 'next';
import { SuccessView } from '@/components/checkout/success-view';

export const metadata: Metadata = {
  title: 'سفارش ثبت شد',
  robots: { index: false },
};

export default async function SuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SuccessView code={code} />;
}
