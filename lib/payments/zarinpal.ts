import type { PaymentDriver } from '@/lib/payments/types';

/** ZarinPal REST v4 — amounts are sent in Toman (currency: IRT). */
export function zarinpalDriver(): PaymentDriver {
  const merchant = process.env.ZARINPAL_MERCHANT_ID ?? '';
  const sandbox = (process.env.ZARINPAL_SANDBOX ?? 'true') === 'true';
  const host = sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';

  const post = async (path: string, body: unknown) => {
    const res = await fetch(`${host}/pg/v4/payment/${path}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    return (await res.json().catch(() => ({}))) as {
      data?: { code?: number; authority?: string; ref_id?: number; card_pan?: string; card_hash?: string; message?: string };
      errors?: { message?: string; code?: number } | unknown[];
    };
  };

  return {
    name: 'zarinpal',
    async request({ amount, callbackUrl, description, mobile, orderCode }) {
      if (!merchant) return { ok: false, message: 'شناسهٔ پذیرندهٔ زرین‌پال تنظیم نشده است.' };
      try {
        const json = await post('request', {
          merchant_id: merchant,
          amount,
          currency: 'IRT',
          callback_url: callbackUrl,
          description,
          metadata: { mobile, order_id: orderCode },
        });
        if (json.data?.code === 100 && json.data.authority) {
          return { ok: true, authority: json.data.authority, redirectUrl: `${host}/pg/StartPay/${json.data.authority}`, raw: json };
        }
        const err = json.errors as { message?: string } | undefined;
        return { ok: false, message: err?.message ?? 'اتصال به درگاه ناموفق بود.', raw: json };
      } catch (e) {
        return { ok: false, message: 'درگاه پرداخت در دسترس نیست. دوباره تلاش کنید.', raw: String(e) };
      }
    },
    async verify({ authority, amount, query }) {
      if (query.Status !== 'OK') return { ok: false, message: 'پرداخت توسط کاربر لغو شد یا ناموفق بود.' };
      try {
        const json = await post('verify', { merchant_id: merchant, amount, authority });
        const code = json.data?.code;
        if (code === 100 || code === 101) {
          return {
            ok: true,
            alreadyVerified: code === 101,
            refId: String(json.data?.ref_id ?? ''),
            cardPan: json.data?.card_pan,
            cardHash: json.data?.card_hash,
            raw: json,
          };
        }
        const err = json.errors as { message?: string } | undefined;
        return { ok: false, message: err?.message ?? 'تأیید پرداخت ناموفق بود.', raw: json };
      } catch (e) {
        return { ok: false, message: 'تأیید پرداخت با خطا مواجه شد.', raw: String(e) };
      }
    },
  };
}
