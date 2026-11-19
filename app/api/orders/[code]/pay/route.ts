import { db } from '@/lib/db';
import { bad, clientIp, json } from '@/lib/http';
import { getUser } from '@/lib/auth/user';
import { startPayment } from '@/lib/services/payments';

/** retry online payment for an unpaid order */
export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  const { code } = await params;
  const order = await db.order.findFirst({ where: { code: decodeURIComponent(code), userId: user.id } });
  if (!order) return bad('سفارش پیدا نشد.', 404);
  if (order.paymentMethod !== 'online' || order.paymentStatus === 'paid' || order.status !== 'pending')
    return bad('این سفارش قابل پرداخت نیست.', 422);
  const pay = await startPayment(order.id, await clientIp());
  if (!pay.ok) return bad(pay.message, 422);
  return json({ ok: true, redirectUrl: pay.redirectUrl });
}
