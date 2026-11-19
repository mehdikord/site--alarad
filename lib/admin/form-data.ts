import 'server-only';
import { toLatinDigits } from '@/lib/format';
import { toId } from '@/lib/db';

/** small, forgiving FormData readers for admin server actions */
export const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();
export const optStr = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v === '' ? null : v;
};
export const int = (fd: FormData, key: string, fallback = 0) => {
  const raw = toLatinDigits(str(fd, key)).replace(/[,٬\s]/g, '');
  const v = Number(raw);
  return raw !== '' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : fallback;
};
export const optInt = (fd: FormData, key: string) => {
  const raw = toLatinDigits(str(fd, key)).replace(/[,٬\s]/g, '');
  if (raw === '') return null;
  const v = Number(raw);
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : null;
};
export const bool = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return v === 'on' || v === 'true' || v === '1';
};
export const id = (fd: FormData, key: string) => toId(str(fd, key));
export const ids = (fd: FormData, key: string) =>
  fd.getAll(key).map((v) => toId(String(v))).filter((v): v is bigint => v !== null);
export const optDate = (fd: FormData, key: string) => {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
export const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9؀-ۿ-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
