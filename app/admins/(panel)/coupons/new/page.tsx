import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader, Panel } from '@/components/admin/ui';
import { CouponForm } from '@/components/admin/sales/coupon-form';
import { createCouponAction } from '../actions';

export const metadata: Metadata = { title: 'کد تخفیف جدید' };

export default function NewCouponPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admins/coupons" className="mb-3 inline-block text-[0.75rem] text-ink-500 hover:text-sage-700">← بازگشت به کدهای تخفیف</Link>
      <AdminPageHeader title="کد تخفیف جدید" />
      <Panel title="مشخصات کد">
        <CouponForm
          action={createCouponAction}
          submit="ساخت کد تخفیف"
          values={{ code: '', title: '', type: 'percent', value: '', maxDiscount: '', minOrderAmount: '', usageLimit: '', perUserLimit: '', startsAt: '', expiresAt: '', isActive: true }}
        />
      </Panel>
    </div>
  );
}
