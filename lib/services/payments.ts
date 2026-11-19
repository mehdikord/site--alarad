import 'server-only';
import { db } from '@/lib/db';
import { appUrl, paymentDriver } from '@/lib/payments';
import { markOrderPaid, changeOrderStatus } from '@/lib/services/orders';

/** Creates a payment row for an order and asks the gateway for a redirect URL. */
export async function startPayment(orderId: bigint, ip?: string | null) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.paymentStatus === 'paid') return { ok: false as const, message: 'این سفارش قبلاً پرداخت شده است.' };
  if (order.status !== 'pending') return { ok: false as const, message: 'این سفارش قابل پرداخت نیست.' };

  const driver = paymentDriver();
  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      gateway: driver.name,
      amount: order.total,
      description: `پرداخت سفارش ${order.code}`,
      ip: ip ?? null,
    },
  });

  const result = await driver.request({
    amount: order.total,
    orderCode: order.code,
    callbackUrl: `${await appUrl()}/api/payments/callback?payment=${payment.id}`,
    description: `سفارش ${order.code} — الاردشاپ`,
    mobile: order.receiverPhone,
  });

  if (!result.ok || !result.authority || !result.redirectUrl) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'failed', failureReason: result.message ?? 'request failed', meta: (result.raw ?? null) as never },
    });
    return { ok: false as const, message: result.message ?? 'اتصال به درگاه ناموفق بود.' };
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { authority: result.authority, meta: (result.raw ?? null) as never },
  });
  return { ok: true as const, redirectUrl: result.redirectUrl, paymentId: payment.id };
}

/** Handles the gateway callback: verifies, marks paid / failed. Returns the order code + outcome. */
export async function completePayment(paymentId: bigint, query: Record<string, string>) {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) return { ok: false, code: null as string | null, message: 'تراکنش پیدا نشد.' };
  const authority = query.Authority ?? query.authority ?? '';
  if (!payment.authority || authority !== payment.authority)
    return { ok: false, code: payment.order.code, message: 'اطلاعات بازگشتی درگاه معتبر نیست.' };
  if (payment.status === 'paid') return { ok: true, code: payment.order.code, message: 'پرداخت قبلاً تأیید شده است.' };
  if (payment.status !== 'pending') return { ok: false, code: payment.order.code, message: 'این تراکنش بسته شده است.' };

  const driver = paymentDriver(payment.gateway);
  const result = await driver.verify({ authority, amount: payment.amount, query });

  if (!result.ok) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: query.Status === 'OK' ? 'failed' : 'cancelled',
        failureReason: result.message ?? null,
        meta: (result.raw ?? null) as never,
      },
    });
    await db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'failed' } });
    return { ok: false, code: payment.order.code, message: result.message ?? 'پرداخت ناموفق بود.' };
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'paid',
        refId: result.refId ?? null,
        cardPan: result.cardPan ?? null,
        cardHash: result.cardHash ?? null,
        paidAt: now,
        verifiedAt: now,
        meta: (result.raw ?? null) as never,
      },
    });
    // the order may have been auto-cancelled while the user was on the bank page — re-open it
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    if (order.status === 'cancelled') {
      await changeOrderStatus(order.id, 'pending', { note: 'بازگشایی پس از پرداخت موفق', tx });
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const it of items)
        if (it.variantId) await tx.productVariant.update({ where: { id: it.variantId }, data: { stock: { decrement: it.quantity } } }).catch(() => null);
    }
    await markOrderPaid(tx, payment.orderId, `پرداخت موفق — کد پیگیری بانکی ${result.refId ?? ''}`.trim());
  });
  return { ok: true, code: payment.order.code, message: 'پرداخت با موفقیت انجام شد.' };
}
