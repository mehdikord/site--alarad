import { db } from '@/lib/db';
import { bad, json } from '@/lib/http';
import { getUser } from '@/lib/auth/user';
import { changeOrderStatus } from '@/lib/services/orders';

/** customer can cancel an order that is not paid yet */
export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  const { code } = await params;
  const order = await db.order.findFirst({ where: { code: decodeURIComponent(code), userId: user.id } });
  if (!order) return bad('سفارش پیدا نشد.', 404);
  if (order.status !== 'pending' || order.paymentStatus === 'paid') return bad('این سفارش دیگر قابل لغو نیست؛ با پشتیبانی تماس بگیرید.', 422);
  await db.$transaction(async (tx) => {
    await tx.payment.updateMany({ where: { orderId: order.id, status: 'pending' }, data: { status: 'cancelled' } });
    await changeOrderStatus(order.id, 'cancelled', { note: 'لغو توسط مشتری', tx });
  });
  return json({ ok: true, message: 'سفارش لغو شد.' });
}
