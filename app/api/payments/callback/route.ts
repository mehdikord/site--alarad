import { NextResponse } from 'next/server';
import { toId } from '@/lib/db';
import { completePayment } from '@/lib/services/payments';
import { appUrl } from '@/lib/payments';

/** Gateway → browser redirect lands here (GET for ZarinPal, mock gateway also uses GET). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const paymentId = toId(query.payment);
  if (!paymentId) return NextResponse.redirect(`${appUrl()}/account`);
  const result = await completePayment(paymentId, query);
  const code = result.code;
  if (!code) return NextResponse.redirect(`${appUrl()}/account`);
  if (result.ok) return NextResponse.redirect(`${appUrl()}/checkout/success/${encodeURIComponent(code)}`);
  return NextResponse.redirect(`${appUrl()}/checkout/result/${encodeURIComponent(code)}?status=failed&message=${encodeURIComponent(result.message)}`);
}
