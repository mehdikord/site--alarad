import 'server-only';
import type { PaymentDriver } from '@/lib/payments/types';
import { mockDriver } from '@/lib/payments/mock';
import { zarinpalDriver } from '@/lib/payments/zarinpal';

export const appUrl = () => (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function paymentDriver(name = process.env.PAYMENT_DRIVER ?? 'mock'): PaymentDriver {
  if (name === 'zarinpal') return zarinpalDriver();
  return mockDriver(appUrl());
}
