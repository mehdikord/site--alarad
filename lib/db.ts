import 'server-only';
import { PrismaClient } from '@prisma/client';

/* BIGINT UNSIGNED ids come back as JS bigint — make them JSON-safe everywhere. */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  interface BigInt {
    toJSON(): number | string;
  }
}
if (!(BigInt.prototype as { toJSON?: unknown }).toJSON) {
  BigInt.prototype.toJSON = function (this: bigint) {
    return this <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(this) : this.toString();
  };
}

export const db =
  globalThis.__prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = db;

/** bigint → number (ids, counts) */
export const n = (v: bigint | number | null | undefined) => (v === null || v === undefined ? null : Number(v));
export const num0 = (v: bigint | number | null | undefined) => (v === null || v === undefined ? 0 : Number(v));

/** parse an incoming id (string | number) into a bigint, or null when invalid */
export function toId(v: unknown): bigint | null {
  if (typeof v === 'bigint') return v > 0n ? v : null;
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return BigInt(v);
  if (typeof v === 'string' && /^\d{1,19}$/.test(v.trim()) && v.trim() !== '0') return BigInt(v.trim());
  return null;
}
