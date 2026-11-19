import type { Metadata } from 'next';
import { AccountView } from '@/components/account/account-view';

export const metadata: Metadata = {
  title: 'حساب کاربری',
  description: 'ورود، سفارش‌های من و پیگیری مرسوله.',
};

export default function AccountPage() {
  return <AccountView />;
}
