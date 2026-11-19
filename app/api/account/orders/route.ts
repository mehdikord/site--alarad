import { db } from '@/lib/db';
import { bad, json } from '@/lib/http';
import { getUser } from '@/lib/auth/user';
import { orderViewInclude, toOrderView } from '@/lib/services/order-view';
import { expireStaleOrders } from '@/lib/services/orders';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return bad('ابتدا وارد حساب شوید.', 401);
  await expireStaleOrders((await getSettings()).paymentTimeoutMinutes).catch(() => 0);
  const rows = await db.order.findMany({ where: { userId: user.id }, include: orderViewInclude, orderBy: { createdAt: 'desc' }, take: 50 });
  return json({ ok: true, orders: rows.map(toOrderView) });
}
