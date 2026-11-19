import { bad, clientIp, json, readJson, userAgent } from '@/lib/http';
import { placeOrder, type PlaceOrderInput } from '@/lib/services/checkout';
import { startPayment } from '@/lib/services/payments';
import { getUser } from '@/lib/auth/user';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad('برای ثبت سفارش ابتدا وارد حساب کاربری شوید.', 401);
  const body = await readJson<PlaceOrderInput>(req);
  if (!body.receiver || !Array.isArray(body.lines)) return bad('درخواست نامعتبر است.');

  const ip = await clientIp();
  const result = await placeOrder(
    {
      lines: body.lines,
      receiver: body.receiver,
      shippingMethodId: body.shippingMethodId ?? null,
      couponCode: body.couponCode ?? null,
      paymentMethod: body.paymentMethod === 'cod' ? 'cod' : 'online',
      saveAddress: !!body.saveAddress,
      addressId: body.addressId ?? null,
      ip,
      userAgent: await userAgent(),
    },
    user.id,
  );

  if (!result.ok) {
    const { quote, ...rest } = result as typeof result & { quote?: { lines: unknown; removed: unknown } };
    return bad(rest.message, 422, {
      errors: 'errors' in rest ? rest.errors : undefined,
      cartChanged: 'cartChanged' in rest ? rest.cartChanged : undefined,
      lines: quote?.lines,
      removed: quote?.removed,
    });
  }

  const order = result.order;
  if (order.paymentMethod === 'cod') return json({ ok: true, code: order.code, redirectUrl: `/checkout/success/${order.code}` });

  const pay = await startPayment(order.id, ip);
  if (!pay.ok) return json({ ok: true, code: order.code, redirectUrl: `/checkout/result/${order.code}?status=failed`, message: pay.message });
  return json({ ok: true, code: order.code, redirectUrl: pay.redirectUrl });
}
