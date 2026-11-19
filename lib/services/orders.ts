import 'server-only';
import type { OrderStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

type Tx = Prisma.TransactionClient;

/** Jalali year (e.g. 1405) for order codes */
function jalaliYear(d = new Date()) {
  const y = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric' }).format(d);
  return y.replace(/\D/g, '');
}

/** AL-1405-482193 — unique, hard to guess */
export async function generateOrderCode(prefix = 'AL', tx: Tx | typeof db = db) {
  for (let i = 0; i < 8; i++) {
    const n = Math.floor(100_000 + Math.random() * 900_000);
    const code = `${prefix}-${jalaliYear()}-${n}`;
    const exists = await tx.order.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error('could not generate a unique order code');
}

/** give reserved stock back (cancel / failed payment / return) */
export async function restock(tx: Tx, orderId: bigint) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  for (const it of items) {
    if (!it.variantId) continue;
    await tx.productVariant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
  }
}

/** Changes the order status, writes the timeline and keeps stock/timestamps in sync. */
export async function changeOrderStatus(
  orderId: bigint,
  status: OrderStatus,
  opts: { note?: string | null; adminId?: bigint | null; visible?: boolean; tx?: Tx } = {},
) {
  const run = async (tx: Tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === status) return order;
    const now = new Date();
    const data: Prisma.OrderUpdateInput = { status };
    if (status === 'shipped' && !order.shippedAt) data.shippedAt = now;
    if (status === 'delivered') data.deliveredAt = now;
    if (status === 'cancelled') data.cancelledAt = now;
    const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });
    if (status === 'processing' && order.paymentMethod === 'online' && order.paymentStatus !== 'paid') {
      // admin manually confirms an online order (e.g. offline bank transfer)
      data.paymentStatus = 'paid';
      data.paidAt = order.paidAt ?? now;
      for (const it of items)
        if (it.productId) await tx.product.update({ where: { id: it.productId }, data: { salesCount: { increment: it.quantity } } });
    }
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
      // cash collected on delivery
      data.paymentStatus = 'paid';
      data.paidAt = now;
      await tx.payment.updateMany({ where: { orderId, gateway: 'cod', status: 'pending' }, data: { status: 'paid', paidAt: now, verifiedAt: now } });
    }
    if ((status === 'cancelled' || status === 'returned') && !['cancelled', 'returned'].includes(order.status)) {
      await restock(tx, order.id);
      // undo sales counters (only counted once the order was paid / COD-confirmed); never below zero
      if (order.status !== 'pending') {
        for (const it of items) {
          if (it.productId)
            await tx.product.updateMany({
              where: { id: it.productId, salesCount: { gte: it.quantity } },
              data: { salesCount: { decrement: it.quantity } },
            });
        }
      }
      if (status === 'cancelled') await tx.payment.updateMany({ where: { orderId, status: 'pending' }, data: { status: 'cancelled' } });
    }
    const updated = await tx.order.update({ where: { id: orderId }, data });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        status,
        note: opts.note ?? null,
        adminId: opts.adminId ?? null,
        isCustomerVisible: opts.visible ?? true,
      },
    });
    return updated;
  };
  return opts.tx ? run(opts.tx) : db.$transaction(run);
}

/** mark an order paid after a verified gateway callback */
export async function markOrderPaid(tx: Tx, orderId: bigint, note: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.paymentStatus === 'paid') return order;
  const now = new Date();
  await tx.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'paid', paidAt: now, status: order.status === 'pending' ? 'processing' : order.status },
  });
  for (const it of order.items) {
    if (it.productId) await tx.product.update({ where: { id: it.productId }, data: { salesCount: { increment: it.quantity } } });
  }
  await tx.orderStatusHistory.create({
    data: { orderId, fromStatus: order.status, status: order.status === 'pending' ? 'processing' : order.status, note },
  });
  return order;
}

/** cancel unpaid online orders older than the payment timeout (called lazily) */
export async function expireStaleOrders(timeoutMinutes: number) {
  const cutoff = new Date(Date.now() - timeoutMinutes * 60_000);
  const stale = await db.order.findMany({
    where: { status: 'pending', paymentMethod: 'online', paymentStatus: { not: 'paid' }, createdAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  });
  for (const o of stale) {
    await db.$transaction(async (tx) => {
      await tx.payment.updateMany({ where: { orderId: o.id, status: 'pending' }, data: { status: 'failed', failureReason: 'مهلت پرداخت تمام شد' } });
      await changeOrderStatus(o.id, 'cancelled', { note: 'لغو خودکار — مهلت پرداخت به پایان رسید', tx });
    });
  }
  return stale.length;
}
