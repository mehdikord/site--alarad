import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/user';
import { orderForUser } from '@/lib/services/order-view';
import { LoginRequired } from '@/components/account/login-required';
import { PaymentResult } from '@/components/checkout/payment-result';

export const metadata: Metadata = { title: 'نتیجهٔ پرداخت', robots: { index: false } };

export default async function PaymentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const code = decodeURIComponent((await params).code);
  const { message } = await searchParams;
  const user = await getUser();
  if (!user) return <LoginRequired title="برای ادامهٔ پرداخت وارد شوید" />;
  const order = await orderForUser(code, user.id);
  if (!order) redirect('/account');
  if (order.paymentStatus === 'paid') redirect(`/checkout/success/${encodeURIComponent(code)}`);
  return <PaymentResult order={order} message={message ?? null} />;
}
