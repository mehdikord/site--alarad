'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus, Address, ShippingMethod, CartItem, CartTotals } from '@/lib/types';
import { trackingCode } from '@/lib/utils';

const SEED_ORDERS: Order[] = [
  {
    code: 'AL-1405-6712',
    createdAt: '2026-10-24T10:12:00.000Z',
    phone: '09121234567',
    items: [],
    address: {
      fullName: 'سارا محمدی',
      phone: '09121234567',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1459873421',
      line1: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳',
    },
    shipping: { id: 'standard', title: 'پست پیشتاز', cost: 49_000, eta: '۲ تا ۴ روز کاری', description: '' },
    payment: { method: 'درگاه پرداخت اینترنتی', maskedCard: '۶۰۳۷ **** **** ۴۲۸۱', paidAt: '2026-10-24T10:15:00.000Z', ref: '982134765' },
    totals: { subtotal: 447_000, shipping: 0, discount: 44_700, tax: 36_207, grandTotal: 438_507, itemCount: 3, freeShippingGap: 53_000 },
    status: 'delivered',
    timeline: [
      { status: 'placed', at: '2026-10-24T10:15:00.000Z', note: 'سفارش با موفقیت ثبت شد' },
      { status: 'processing', at: '2026-10-24T15:40:00.000Z', note: 'آماده‌سازی در انبار' },
      { status: 'shipped', at: '2026-10-25T08:10:00.000Z', note: 'تحویل به پست پیشتاز' },
      { status: 'delivered', at: '2026-10-27T11:25:00.000Z', note: 'تحویل به مشتری' },
    ],
  },
  {
    code: 'AL-1405-4187',
    createdAt: '2026-11-02T07:32:00.000Z',
    phone: '09121234567',
    items: [],
    address: {
      fullName: 'سارا محمدی',
      phone: '09121234567',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1459873421',
      line1: 'خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳',
    },
    shipping: { id: 'express', title: 'ارسال سریع تهران', cost: 89_000, eta: 'همان روز', description: '' },
    payment: { method: 'درگاه پرداخت اینترنتی', maskedCard: '۶۰۳۷ **** **** ۴۲۸۱', paidAt: '2026-11-02T07:35:00.000Z', ref: '982199112' },
    totals: { subtotal: 358_000, shipping: 89_000, discount: 0, tax: 32_220, grandTotal: 479_220, itemCount: 2, freeShippingGap: 142_000 },
    status: 'shipped',
    timeline: [
      { status: 'placed', at: '2026-11-02T07:35:00.000Z', note: 'سفارش با موفقیت ثبت شد' },
      { status: 'processing', at: '2026-11-02T09:00:00.000Z', note: 'آماده‌سازی در انبار' },
      { status: 'shipped', at: '2026-11-02T13:45:00.000Z', note: 'تحویل به پیک شهر تهران' },
    ],
  },
];

interface OrdersState {
  orders: Order[];
  place: (input: {
    items: CartItem[];
    address: Address;
    shipping: ShippingMethod;
    totals: CartTotals;
    coupon?: { code: string; amount: number };
    payment: { maskedCard: string };
  }) => Order;
  advance: (code: string, status: OrderStatus) => void;
  cancel: (code: string) => void;
  byCode: (code: string) => Order | undefined;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: SEED_ORDERS,
      place: ({ items, address, shipping, totals, coupon, payment }) => {
        const now = new Date();
        const order: Order = {
          code: trackingCode(),
          createdAt: now.toISOString(),
          items,
          address,
          shipping,
          payment: {
            method: 'درگاه پرداخت اینترنتی',
            maskedCard: payment.maskedCard,
            paidAt: now.toISOString(),
            ref: String(Math.floor(100_000_000 + Math.random() * 899_999_999)),
          },
          coupon,
          totals,
          status: 'processing',
          timeline: [
            { status: 'placed', at: now.toISOString(), note: 'سفارش با موفقیت ثبت شد' },
            { status: 'processing', at: now.toISOString(), note: 'در حال آماده‌سازی در انبار' },
          ],
          phone: address.phone,
        };
        set({ orders: [order, ...get().orders] });
        return order;
      },
      advance: (code, status) =>
        set({
          orders: get().orders.map((o) =>
            o.code === code
              ? { ...o, status, timeline: [...o.timeline, { status, at: new Date().toISOString() }] }
              : o,
          ),
        }),
      cancel: (code) =>
        set({
          orders: get().orders.map((o) =>
            o.code === code
              ? { ...o, status: 'cancelled', timeline: [...o.timeline, { status: 'cancelled', at: new Date().toISOString(), note: 'لغو توسط مشتری' }] }
              : o,
          ),
        }),
      byCode: (code) => get().orders.find((o) => o.code === code),
    }),
    { name: 'alarad-orders', skipHydration: true },
  ),
);

export const STATUS_META: Record<OrderStatus, { label: string; tone: string; dot: string }> = {
  pending: { label: 'در انتظار پرداخت', tone: 'bg-cream-200 text-ink-700', dot: 'bg-ink-300' },
  processing: { label: 'در حال آماده‌سازی', tone: 'bg-sage-100 text-sage-700', dot: 'bg-sage-500' },
  shipped: { label: 'ارسال شده', tone: 'bg-blush-100 text-blush-500', dot: 'bg-blush-300' },
  delivered: { label: 'تحویل شده', tone: 'bg-sage-200 text-sage-700', dot: 'bg-sage-600' },
  cancelled: { label: 'لغو شده', tone: 'bg-cream-300 text-ink-500', dot: 'bg-ink-300' },
};

export const STATUS_STEPS: OrderStatus[] = ['processing', 'shipped', 'delivered'];
