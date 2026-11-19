import { bad, json } from '@/lib/http';
import { publicTracking } from '@/lib/services/order-view';

/** public order tracking by code — status + carrier tracking code only (no personal data) */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get('code') ?? '').trim();
  if (code.length < 6) return bad('کد سفارش را کامل وارد کنید.', 422);
  const t = await publicTracking(code);
  if (!t) return bad('سفارشی با این کد پیدا نشد.', 404);
  return json({ ok: true, tracking: t });
}
