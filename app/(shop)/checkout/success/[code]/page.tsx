import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SuccessView } from '@/components/checkout/success-view';
import { getUser } from '@/lib/auth/user';
import { orderForUser } from '@/lib/services/order-view';
import { LoginRequired } from '@/components/account/login-required';

export const metadata: Metadata = {
  title: 'سفارش ثبت شد',
  robots: { index: false },
};

export default async function SuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const user = await getUser();
  if (!user) return <LoginRequired title="برای دیدن جزئیات سفارش وارد شوید" />;
  const order = await orderForUser(code, user.id);
  if (order && order.canPay) redirect(`/checkout/result/${encodeURIComponent(code)}?status=pending`);
  return <SuccessView code={code} order={order} />;
}
