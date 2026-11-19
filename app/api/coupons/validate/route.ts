import { bad, json, readJson } from '@/lib/http';
import { checkCoupon } from '@/lib/services/pricing';
import { getUser } from '@/lib/auth/user';

export async function POST(req: Request) {
  const body = await readJson<{ code?: string; subtotal?: number }>(req);
  const user = await getUser();
  const subtotal = Math.max(0, Math.round(Number(body.subtotal) || 0));
  const result = await checkCoupon(String(body.code ?? ''), subtotal, user?.id ?? null);
  if (!result.ok || !result.coupon) return bad(result.message, 422);
  return json({ ok: true, code: result.coupon.code, amount: result.amount, message: result.message });
}
