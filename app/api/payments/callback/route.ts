import { toId } from '@/lib/db';
import { completePayment } from '@/lib/services/payments';

/** relative redirect — stays on the public domain even behind a reverse proxy */
const redirectTo = (location: string) => new Response(null, { status: 303, headers: { Location: location } });

/** Gateway → browser redirect lands here (GET for ZarinPal, mock gateway also uses GET). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const paymentId = toId(query.payment);
  if (!paymentId) return redirectTo(`/account`);
  const result = await completePayment(paymentId, query);
  const code = result.code;
  if (!code) return redirectTo(`/account`);
  if (result.ok) return redirectTo(`/checkout/success/${encodeURIComponent(code)}`);
  return redirectTo(`/checkout/result/${encodeURIComponent(code)}?status=failed&message=${encodeURIComponent(result.message)}`);
}
