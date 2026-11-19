import 'server-only';
import type { Prisma } from '@prisma/client';
import { date, dateTime } from '@/lib/format';

/** orders that count as a sale: paid online, or COD accepted into fulfilment */
export const SALE_WHERE: Prisma.OrderWhereInput = {
  OR: [
    { paymentStatus: 'paid', status: { notIn: ['cancelled', 'returned'] } },
    { paymentMethod: 'cod', status: { in: ['processing', 'shipped', 'delivered'] } },
  ],
};

export const fDate = (d: Date | null | undefined) => (d ? date(d.toISOString()) : '—');
export const fDateTime = (d: Date | null | undefined) => (d ? dateTime(d.toISOString()) : '—');

/** value for <input type="datetime-local"> in server local time */
export function toLocalInput(d: Date | null | undefined) {
  if (!d) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export type SP = Record<string, string | string[] | undefined>;
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** parse YYYY-MM-DD as local day start/end */
export function dayStart(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
export function dayEnd(v: string) {
  const d = dayStart(v);
  return d ? new Date(d.getTime() + 86_400_000 - 1) : null;
}
