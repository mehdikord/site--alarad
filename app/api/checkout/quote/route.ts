import { json, readJson } from '@/lib/http';
import { quote, type QuoteInput } from '@/lib/services/checkout';
import { getUser } from '@/lib/auth/user';

/** live, server-side pricing of the cart (shipping methods per province, coupon, tax, stock) */
export async function POST(req: Request) {
  const body = await readJson<QuoteInput>(req);
  const user = await getUser();
  const q = await quote({
    lines: Array.isArray(body.lines) ? body.lines : [],
    provinceId: body.provinceId ?? null,
    shippingMethodId: body.shippingMethodId ?? null,
    couponCode: body.couponCode ?? null,
    userId: user?.id ?? null,
  });
  const { _internal, ...pub } = q;
  void _internal;
  return json({ ok: true, ...pub });
}
