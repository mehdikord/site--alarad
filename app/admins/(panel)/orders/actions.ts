'use server';

import type { OrderStatus, ShipmentStatus } from '@prisma/client';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { fail, ok, type ActionState } from '@/lib/admin/action';
import { bool, id, optStr, str } from '@/lib/admin/form-data';
import { NEXT_STATUSES, ORDER_STATUS, type OrderStatusKey } from '@/lib/order-meta';
import { changeOrderStatus } from '@/lib/services/orders';
import { saveShipment, SHIPMENT_STATUSES } from '@/lib/admin/sales/shipments';

export async function changeStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const orderId = id(fd, 'orderId');
  const status = str(fd, 'status') as OrderStatusKey;
  if (!orderId) return fail('سفارش نامعتبر است.');
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return fail('سفارش پیدا نشد.');
  if (!NEXT_STATUSES[order.status as OrderStatusKey].includes(status))
    return fail(`تغییر وضعیت از «${ORDER_STATUS[order.status as OrderStatusKey].label}» به این وضعیت مجاز نیست.`);
  await changeOrderStatus(orderId, status as OrderStatus, {
    note: optStr(fd, 'note'),
    adminId: admin.id,
    visible: bool(fd, 'visible'),
  });
  return ok(`وضعیت سفارش به «${ORDER_STATUS[status].label}» تغییر کرد.`);
}

export async function saveShipmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const orderId = id(fd, 'orderId');
  const status = str(fd, 'status') as ShipmentStatus;
  if (!orderId) return fail('سفارش نامعتبر است.');
  if (!SHIPMENT_STATUSES.includes(status)) return fail('وضعیت ارسال نامعتبر است.');
  const trackingCode = optStr(fd, 'trackingCode');
  if (trackingCode && trackingCode.length > 100) return fail('کد رهگیری طولانی است.', { trackingCode: 'حداکثر ۱۰۰ کاراکتر' });
  const r = await saveShipment({
    orderId,
    shipmentId: id(fd, 'shipmentId'),
    carrier: optStr(fd, 'carrier'),
    trackingCode,
    trackingUrl: optStr(fd, 'trackingUrl'),
    status,
    note: optStr(fd, 'note'),
    adminId: admin.id,
  });
  return r.ok ? ok(r.message) : fail(r.message);
}

export async function saveAdminNoteAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const orderId = id(fd, 'orderId');
  if (!orderId) return fail('سفارش نامعتبر است.');
  await db.order.update({ where: { id: orderId }, data: { adminNote: optStr(fd, 'adminNote') } });
  return ok('یادداشت مدیر ذخیره شد.');
}
