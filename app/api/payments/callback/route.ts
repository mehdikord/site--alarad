import { toId } from '@/lib/db';
import { completePayment } from '@/lib/services/payments';
import { appUrl } from '@/lib/payments';

/** absolute redirect on the public domain (APP_URL / proxy headers), never the internal address */
const redirectTo = async (path: string) => Response.redirect(`${await appUrl()}${path}`, 303);

/** Gateway → browser redirect lands here (GET for ZarinPal, mock gateway also uses GET). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const paymentId = toId(query.payment);
  if (!paymentId) return await redirectTo(`/account`);
  const result = await completePayment(paymentId, query);
  const code = result.code;
  if (!code) return await redirectTo(`/account`);
  if (result.ok) return await redirectTo(`/checkout/success/${encodeURIComponent(code)}`);
  return await redirectTo(`/checkout/result/${encodeURIComponent(code)}?status=failed&message=${encodeURIComponent(result.message)}`);
}
