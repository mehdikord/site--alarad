import 'server-only';
import { headers } from 'next/headers';
import type { PaymentDriver } from '@/lib/payments/types';
import { mockDriver } from '@/lib/payments/mock';
import { zarinpalDriver } from '@/lib/payments/zarinpal';

/**
 * Public origin of the site (used for the gateway callback URL).
 * APP_URL wins when it is set to a real domain; otherwise it is derived from the
 * proxy headers of the current request (X-Forwarded-Host / Host).
 */
export async function appUrl() {
  const env = (process.env.APP_URL ?? '').trim().replace(/\/$/, '');
  if (env && !/\/\/(localhost|127\.0\.0\.1)(:|$)/.test(env)) return env;
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() || h.get('host');
    const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || (host?.startsWith('localhost') ? 'http' : 'https');
    if (host) return `${proto}://${host}`;
  } catch {
    // outside a request
  }
  return env || 'http://localhost:3000';
}

export function paymentDriver(name = process.env.PAYMENT_DRIVER ?? 'mock'): PaymentDriver {
  if (name === 'zarinpal') return zarinpalDriver();
  return mockDriver();
}
