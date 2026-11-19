import { randomBytes } from 'node:crypto';
import type { PaymentDriver } from '@/lib/payments/types';

/** Local test gateway — renders /payment/mock/[authority] instead of a bank page. */
export function mockDriver(appUrl: string): PaymentDriver {
  return {
    name: 'mock',
    async request() {
      const authority = `MOCK${Date.now()}${randomBytes(6).toString('hex')}`.toUpperCase();
      return { ok: true, authority, redirectUrl: `${appUrl}/payment/mock/${authority}` };
    },
    async verify({ query }) {
      if (query.Status !== 'OK') return { ok: false, message: 'پرداخت توسط کاربر لغو شد.' };
      return {
        ok: true,
        refId: String(Math.floor(100_000_000 + Math.random() * 899_999_999)),
        cardPan: query.card || '603799******1111',
      };
    },
  };
}
