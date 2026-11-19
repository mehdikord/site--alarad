import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  supportHours: string;
  taxRate: number; // percent
  freeShippingThreshold: number;
  lowStockThreshold: number;
  orderCodePrefix: string;
  paymentTimeoutMinutes: number;
  codEnabled: boolean;
  reviewsAutoApprove: boolean;
}

const DEFAULTS: StoreSettings = {
  storeName: 'الاردشاپ',
  storePhone: '',
  storeEmail: '',
  storeAddress: '',
  supportHours: '',
  taxRate: 9,
  freeShippingThreshold: 500_000,
  lowStockThreshold: 5,
  orderCodePrefix: 'AL',
  paymentTimeoutMinutes: 30,
  codEnabled: true,
  reviewsAutoApprove: false,
};

const KEY_MAP: Record<string, keyof StoreSettings> = {
  store_name: 'storeName',
  store_phone: 'storePhone',
  store_email: 'storeEmail',
  store_address: 'storeAddress',
  support_hours: 'supportHours',
  tax_rate: 'taxRate',
  free_shipping_threshold: 'freeShippingThreshold',
  low_stock_threshold: 'lowStockThreshold',
  order_code_prefix: 'orderCodePrefix',
  payment_timeout_minutes: 'paymentTimeoutMinutes',
  cod_enabled: 'codEnabled',
  reviews_auto_approve: 'reviewsAutoApprove',
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.setting.findMany();
  const out: StoreSettings = { ...DEFAULTS };
  for (const r of rows) {
    const k = KEY_MAP[r.key];
    if (!k || r.value === null) continue;
    const def = DEFAULTS[k];
    (out as unknown as Record<string, unknown>)[k] =
      typeof def === 'number' ? Number(r.value) || 0 : typeof def === 'boolean' ? r.value === 'true' || r.value === '1' : r.value;
  }
  return out;
});
