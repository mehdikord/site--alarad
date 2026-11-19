import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { OrderView } from '@/lib/types';

export const orderViewInclude = {
  items: { orderBy: { id: 'asc' } },
  province: true,
  city: true,
  payments: { where: { status: 'paid' }, orderBy: { paidAt: 'desc' }, take: 1 },
  shipments: { orderBy: { createdAt: 'desc' } },
  statusHistories: { where: { isCustomerVisible: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderViewInclude }>;

export function toOrderView(o: OrderRow): OrderView {
  const pay = o.payments[0];
  return {
    code: o.code,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    items: o.items.map((i) => ({
      id: Number(i.id),
      productSlug: i.productSlug,
      name: i.productName,
      sku: i.sku,
      colorName: i.colorName,
      colorHex: i.colorHex,
      sizeLabel: i.sizeLabel,
      image: i.imageUrl,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      total: i.total,
    })),
    receiver: {
      name: o.receiverName,
      phone: o.receiverPhone,
      province: o.province.name,
      city: o.city.name,
      postalCode: o.postalCode,
      address: o.address,
      unit: o.unit,
    },
    shipping: { title: o.shippingTitle ?? '', eta: o.shippingEta ?? '', cost: o.shippingCost },
    totals: { subtotal: o.subtotal, discount: o.discount, shipping: o.shippingCost, tax: o.tax, total: o.total, itemCount: o.itemCount },
    couponCode: o.couponCode,
    payment: pay ? { gateway: pay.gateway, refId: pay.refId, cardPan: pay.cardPan, paidAt: pay.paidAt?.toISOString() ?? null } : null,
    shipments: o.shipments.map((s) => ({
      carrier: s.carrier,
      trackingCode: s.trackingCode,
      trackingUrl: s.trackingUrl,
      status: s.status,
      shippedAt: s.shippedAt?.toISOString() ?? null,
      deliveredAt: s.deliveredAt?.toISOString() ?? null,
    })),
    timeline: o.statusHistories.map((h) => ({ status: h.status, note: h.note, at: h.createdAt.toISOString() })),
    canPay: o.paymentMethod === 'online' && o.status === 'pending' && o.paymentStatus !== 'paid',
    canCancel: o.status === 'pending' && o.paymentStatus !== 'paid',
  };
}

export async function orderForUser(code: string, userId: bigint) {
  const o = await db.order.findFirst({ where: { code, userId }, include: orderViewInclude });
  return o ? toOrderView(o) : null;
}

/** public tracking by code: status + shipment tracking only, no personal data */
export async function publicTracking(code: string) {
  const o = await db.order.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { shipments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!o) return null;
  const s = o.shipments[0];
  return {
    code: o.code,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    trackingCode: s?.trackingCode ?? null,
    trackingUrl: s?.trackingUrl ?? null,
    carrier: s?.carrier ?? null,
  };
}
