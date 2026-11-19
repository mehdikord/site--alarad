import type { Metadata } from 'next';
import { OrderDetail } from '@/components/account/order-detail';
import { LoginRequired } from '@/components/account/login-required';
import { EmptyState } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/button';
import { getUser } from '@/lib/auth/user';
import { orderForUser } from '@/lib/services/order-view';

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
  robots: { index: false },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const user = await getUser();
  if (!user) return <LoginRequired title="برای دیدن جزئیات سفارش وارد شوید" />;
  const order = await orderForUser(code, user.id);
  if (!order) {
    return (
      <div className="container-x">
        <EmptyState
          variant="box"
          title="این سفارش پیدا نشد"
          description="این سفارش متعلق به حساب شما نیست یا کد آن اشتباه است. برای پیگیری عمومی از بخش «پیگیری مرسوله» استفاده کنید."
          action={<ButtonLink href="/account" variant="primary" size="md">بازگشت به حساب</ButtonLink>}
        />
      </div>
    );
  }
  return <OrderDetail order={order} />;
}
