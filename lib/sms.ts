import 'server-only';

/** SMS gateway abstraction. `log` driver prints to the server console (development). */
export async function sendSms(phone: string, message: string) {
  const driver = process.env.SMS_DRIVER ?? 'log';
  if (driver === 'log') {
    console.info(`[sms:${phone}] ${message}`);
    return { ok: true };
  }
  // plug a real provider (Kavenegar, SMS.ir, …) here
  console.warn(`[sms] driver "${driver}" not implemented — message to ${phone} not sent`);
  return { ok: false };
}

export const smsIsFake = () => (process.env.SMS_DRIVER ?? 'log') === 'log';
