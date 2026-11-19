import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';

export const metadata: Metadata = {
  title: 'سبد خرید',
  description: 'بازبینی کالاهای انتخابی و ادامهٔ خرید در الاردشاپ.',
};

export default function CartPage() {
  return <CartView />;
}
