const faNum = new Intl.NumberFormat('fa-IR');
const faDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const faDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** ۱۲۳٬۴۵۶ */
export const num = (n: number) => faNum.format(n);

/** ۱۲۳٬۴۵۶ تومان */
export const toman = (n: number) => `${faNum.format(Math.round(n))} تومان`;

/** ۱۲۳٬۴۵۶ (short, for cards where «تومان» sits in the label) */
export const money = (n: number) => faNum.format(Math.round(n));

export const date = (iso: string) => faDate.format(new Date(iso));
export const dateTime = (iso: string) => faDateTime.format(new Date(iso));

/** «۲ روز پیش» — used in reviews */
export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return `${num(days)} روز پیش`;
  if (days < 31) return `${num(Math.floor(days / 7))} هفته پیش`;
  if (days < 365) return `${num(Math.floor(days / 30))} ماه پیش`;
  return `${num(Math.floor(days / 365))} سال پیش`;
}

/** Persian-safe percent */
export const percent = (n: number) => `${num(Math.round(n))}٪`;

/** Convert Persian/Arabic digits typed by users into latin digits */
export function toLatinDigits(input: string) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = fa.indexOf(d);
    return i >= 0 ? String(i) : String(ar.indexOf(d));
  });
}

export function normalizePhone(input: string) {
  const d = toLatinDigits(input).replace(/\D/g, '');
  if (d.startsWith('98')) return '0' + d.slice(2);
  if (d.startsWith('9') && d.length === 10) return '0' + d;
  return d;
}

export const isValidIranPhone = (input: string) => /^09\d{9}$/.test(normalizePhone(input));
export const isValidPostal = (input: string) => /^\d{10}$/.test(toLatinDigits(input).replace(/\D/g, ''));
