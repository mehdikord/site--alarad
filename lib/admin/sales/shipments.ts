import 'server-only';
import type { ShipmentStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { changeOrderStatus } from '@/lib/services/orders';

export const SHIPMENT_STATUSES: ShipmentStatus[] = ['pending', 'preparing', 'shipped', 'delivered', 'returned'];

export interface ShipmentInput {
  orderId: bigint;
  shipmentId: bigint | null;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  note: string | null;
  adminId: bigint;
}

/**
 * Creates/updates a shipment and keeps the order lifecycle in sync:
 *  shipped  → order processing → shipped (note contains the tracking code)
 *  delivered → order → delivered
 */
export async function saveShipment(input: ShipmentInput): Promise<{ ok: boolean; message: string }> {
  const order = await db.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false, message: 'سفارش پیدا نشد.' };
  if (['pending', 'cancelled'].includes(order.status) && ['shipped', 'delivered'].includes(input.status))
    return { ok: false, message: 'سفارش پرداخت‌نشده یا لغوشده قابل ارسال نیست.' };
  if (input.trackingUrl && !/^https?:\/\//i.test(input.trackingUrl))
    return { ok: false, message: 'نشانی رهگیری باید با http:// یا https:// شروع شود.' };

  const now = new Date();
  await db.$transaction(async (tx) => {
    const prev = input.shipmentId
      ? await tx.shipment.findFirst({ where: { id: input.shipmentId, orderId: order.id } })
      : null;
    const data = {
      carrier: input.carrier,
      trackingCode: input.trackingCode,
      trackingUrl: input.trackingUrl,
      status: input.status,
      note: input.note,
      adminId: input.adminId,
      shippedAt: ['shipped', 'delivered'].includes(input.status) ? (prev?.shippedAt ?? now) : prev?.shippedAt ?? null,
      deliveredAt: input.status === 'delivered' ? (prev?.deliveredAt ?? now) : null,
    };
    if (prev) await tx.shipment.update({ where: { id: prev.id }, data });
    else await tx.shipment.create({ data: { ...data, orderId: order.id, shippingMethodId: order.shippingMethodId } });

    const code = input.trackingCode ? ` — کد رهگیری مرسوله: ${input.trackingCode}` : '';
    let status = order.status;
    if ((input.status === 'shipped' || input.status === 'delivered') && status === 'processing') {
      await changeOrderStatus(order.id, 'shipped', { note: `مرسوله تحویل ${input.carrier ?? 'حمل‌کننده'} شد${code}`, adminId: input.adminId, tx });
      status = 'shipped';
    }
    if (input.status === 'delivered' && status === 'shipped') {
      await changeOrderStatus(order.id, 'delivered', { note: 'مرسوله به مشتری تحویل داده شد', adminId: input.adminId, tx });
      status = 'delivered';
    }
    if (input.status === 'returned' && (status === 'shipped' || status === 'delivered')) {
      await changeOrderStatus(order.id, 'returned', { note: 'مرسوله برگشت خورد', adminId: input.adminId, tx });
      status = 'returned';
    }
    // tracking code added/changed on an order whose status did not move → still tell the customer
    const codeChanged = input.trackingCode && input.trackingCode !== (prev?.trackingCode ?? null);
    if (codeChanged && status === order.status) {
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, adminId: input.adminId, fromStatus: status, status, note: `کد رهگیری مرسوله ثبت شد: ${input.trackingCode}` },
      });
    }
  });
  return { ok: true, message: input.shipmentId ? 'اطلاعات ارسال به‌روزرسانی شد.' : 'مرسوله ثبت شد.' };
}
