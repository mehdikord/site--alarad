import type { Metadata } from 'next';
import { CheckoutFlow } from '@/components/checkout/checkout-flow';

export const metadata: Metadata = {
  title: 'تکمیل خرید',
  description: 'اطلاعات ارسال، روش ارسال و پرداخت امن.',
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
