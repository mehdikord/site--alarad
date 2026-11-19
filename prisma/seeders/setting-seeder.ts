import { prisma, log } from './client';

export const DEFAULT_SETTINGS: { key: string; value: string; type: string; group: string; label: string }[] = [
  { key: 'store_name', value: 'الاردشاپ', type: 'string', group: 'general', label: 'نام فروشگاه' },
  { key: 'store_phone', value: '021-91001234', type: 'string', group: 'general', label: 'تلفن پشتیبانی' },
  { key: 'store_email', value: 'hello@alarad.shop', type: 'string', group: 'general', label: 'ایمیل پشتیبانی' },
  { key: 'store_address', value: 'تهران، خیابان ولیعصر', type: 'text', group: 'general', label: 'نشانی بوتیک' },
  { key: 'support_hours', value: 'هر روز ۹ تا ۲۱', type: 'string', group: 'general', label: 'ساعات پاسخ‌گویی' },
  { key: 'tax_rate', value: '9', type: 'number', group: 'checkout', label: 'نرخ مالیات بر ارزش افزوده (٪)' },
  { key: 'free_shipping_threshold', value: '500000', type: 'number', group: 'checkout', label: 'حداقل خرید برای ارسال رایگان (تومان)' },
  { key: 'low_stock_threshold', value: '5', type: 'number', group: 'inventory', label: 'آستانهٔ کم‌موجودی' },
  { key: 'order_code_prefix', value: 'AL', type: 'string', group: 'checkout', label: 'پیشوند کد سفارش' },
  { key: 'payment_timeout_minutes', value: '30', type: 'number', group: 'checkout', label: 'مهلت پرداخت سفارش (دقیقه)' },
  { key: 'cod_enabled', value: 'true', type: 'boolean', group: 'checkout', label: 'پرداخت در محل فعال باشد' },
  { key: 'reviews_auto_approve', value: 'false', type: 'boolean', group: 'catalog', label: 'تأیید خودکار نظرها' },
];

export async function settingSeeder() {
  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { type: s.type, group: s.group, label: s.label },
      create: s,
    });
  }
  log('SettingSeeder', `${DEFAULT_SETTINGS.length} settings`);
}
