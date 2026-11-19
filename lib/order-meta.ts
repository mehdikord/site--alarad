/** Client-safe labels & tones for order / payment / shipment enums. */
export type OrderStatusKey = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatusKey = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type TransactionStatusKey = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type ShipmentStatusKey = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';

export const ORDER_STATUS: Record<OrderStatusKey, { label: string; tone: string; dot: string }> = {
  pending: { label: 'در انتظار پرداخت', tone: 'bg-cream-200 text-ink-700', dot: 'bg-ink-300' },
  processing: { label: 'در حال آماده‌سازی', tone: 'bg-sage-100 text-sage-700', dot: 'bg-sage-500' },
  shipped: { label: 'ارسال شده', tone: 'bg-blush-100 text-blush-500', dot: 'bg-blush-300' },
  delivered: { label: 'تحویل شده', tone: 'bg-sage-200 text-sage-700', dot: 'bg-sage-600' },
  cancelled: { label: 'لغو شده', tone: 'bg-cream-300 text-ink-500', dot: 'bg-ink-300' },
  returned: { label: 'مرجوع شده', tone: 'bg-cream-300 text-ink-500', dot: 'bg-ink-300' },
};

export const PAYMENT_STATUS: Record<PaymentStatusKey, { label: string; tone: string }> = {
  unpaid: { label: 'پرداخت نشده', tone: 'bg-cream-200 text-ink-600' },
  paid: { label: 'پرداخت شده', tone: 'bg-sage-100 text-sage-700' },
  failed: { label: 'ناموفق', tone: 'bg-blush-100 text-blush-500' },
  refunded: { label: 'بازپرداخت شده', tone: 'bg-cream-300 text-ink-500' },
};

export const TRANSACTION_STATUS: Record<TransactionStatusKey, { label: string; tone: string }> = {
  pending: { label: 'در انتظار', tone: 'bg-cream-200 text-ink-600' },
  paid: { label: 'موفق', tone: 'bg-sage-100 text-sage-700' },
  failed: { label: 'ناموفق', tone: 'bg-blush-100 text-blush-500' },
  cancelled: { label: 'انصراف کاربر', tone: 'bg-cream-300 text-ink-500' },
  refunded: { label: 'بازپرداخت', tone: 'bg-cream-300 text-ink-500' },
};

export const SHIPMENT_STATUS: Record<ShipmentStatusKey, { label: string; tone: string }> = {
  pending: { label: 'در انتظار', tone: 'bg-cream-200 text-ink-600' },
  preparing: { label: 'در حال بسته‌بندی', tone: 'bg-sage-100 text-sage-700' },
  shipped: { label: 'تحویل به حمل‌کننده', tone: 'bg-blush-100 text-blush-500' },
  delivered: { label: 'تحویل به مشتری', tone: 'bg-sage-200 text-sage-700' },
  returned: { label: 'برگشت خورده', tone: 'bg-cream-300 text-ink-500' },
};

export const PAYMENT_METHOD_LABEL: Record<'online' | 'cod', string> = {
  online: 'پرداخت اینترنتی',
  cod: 'پرداخت در محل',
};

export const GATEWAY_LABEL: Record<string, string> = {
  zarinpal: 'زرین‌پال',
  mock: 'درگاه آزمایشی',
  cod: 'پرداخت در محل',
};

/** allowed admin transitions */
export const NEXT_STATUSES: Record<OrderStatusKey, OrderStatusKey[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

/** storefront progress steps */
export const PROGRESS_STEPS: OrderStatusKey[] = ['pending', 'processing', 'shipped', 'delivered'];
